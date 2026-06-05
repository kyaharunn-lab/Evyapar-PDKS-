"use client"

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: any) => void | Promise<void>>
    __evyaparOneSignalScriptLoading?: boolean
  }
}

const ONESIGNAL_SDK_SRC = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"

export function loadOneSignalSdk() {
  if (typeof window === "undefined") return Promise.resolve(false)
  if (document.querySelector(`script[src="${ONESIGNAL_SDK_SRC}"]`)) {
    return Promise.resolve(true)
  }
  if (window.__evyaparOneSignalScriptLoading) {
    return Promise.resolve(true)
  }

  window.__evyaparOneSignalScriptLoading = true
  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script")
    script.src = ONESIGNAL_SDK_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve(true)
    script.onerror = () => {
      console.warn("[OneSignal mobile] SDK yuklenemedi.")
      resolve(false)
    }
    document.head.appendChild(script)
  })
}

export async function syncOneSignalSubscription(personnelId: string, options: { requestPermission: boolean }) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
  if (!appId) {
    throw new Error("NEXT_PUBLIC_ONESIGNAL_APP_ID tanimli degil.")
  }

  const sdkLoaded = await loadOneSignalSdk()
  if (!sdkLoaded) {
    throw new Error("OneSignal SDK yuklenemedi.")
  }

  return new Promise<{ oneSignalId: string; subscribed: boolean; permission: boolean }>((resolve, reject) => {
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal: any) => {
      try {
        try {
          console.info("[OneSignal mobile] initialize starting", { appId })
          await OneSignal.init({ appId })
          console.info("[OneSignal mobile] OneSignal initialized")
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          if (!/already initialized/i.test(message)) throw error
          console.info("[OneSignal mobile] OneSignal initialized", { alreadyInitialized: true })
        }

        await OneSignal.login(personnelId)
        console.info("[OneSignal mobile] external user linked", { personnelId })

        let permission = Boolean(OneSignal.Notifications?.permission)
        console.info("[OneSignal mobile] Permission current", { permission })
        if (options.requestPermission && !permission) {
          await OneSignal.Notifications?.requestPermission?.()
          permission = Boolean(OneSignal.Notifications?.permission)
        }
        console.info(`[OneSignal mobile] Permission ${permission ? "granted" : "denied"}`, { permission })

        const pushSubscription = OneSignal.User?.PushSubscription
        const oneSignalId = (pushSubscription?.id || pushSubscription?.token || "").toString()
        const subscribed = Boolean(pushSubscription?.optedIn ?? oneSignalId)
        console.info("[OneSignal mobile] Player ID", {
          oneSignalId: oneSignalId || null,
          subscribed,
          optedIn: pushSubscription?.optedIn,
        })

        resolve({ oneSignalId, subscribed, permission })
      } catch (error) {
        reject(error)
      }
    })
  })
}
