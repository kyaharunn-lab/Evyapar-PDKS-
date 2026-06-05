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
  window.OneSignalDeferred = window.OneSignalDeferred || []
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

function assertPushSupported() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    throw new Error("Bildirimler bu tarayıcıda desteklenmiyor olabilir.")
  }

  const userAgent = navigator.userAgent || ""
  const isIos = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as any).standalone)
  if (isIos && !isStandalone) {
    throw new Error("Bildirimler için uygulamayı ana ekrana eklemeniz gerekebilir.")
  }

  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  const isSecure = window.isSecureContext || isLocalhost
  const supported = isSecure && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window

  if (!supported) {
    throw new Error("Bildirimler bu tarayıcıda desteklenmiyor olabilir.")
  }
}

async function withOneSignal<T>(callback: (oneSignal: any) => Promise<T>, timeoutMs = 8000) {
  const sdkPromise = new Promise<T>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Bildirimler bu tarayıcıda desteklenmiyor olabilir."))
      return
    }

    let settled = false
    const timer = window.setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error("Bildirim servisi henüz hazır değil, birkaç saniye sonra tekrar deneyin."))
    }, timeoutMs)

    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async function (OneSignal: any) {
      if (settled) return
      try {
        const result = await callback(OneSignal)
        settled = true
        window.clearTimeout(timer)
        resolve(result)
      } catch (error) {
        settled = true
        window.clearTimeout(timer)
        reject(error)
      }
    })
  })

  const sdkLoaded = await loadOneSignalSdk()
  if (!sdkLoaded) {
    throw new Error("Bildirim servisi henüz hazır değil, birkaç saniye sonra tekrar deneyin.")
  }

  return sdkPromise
}

function readNotificationPermission(OneSignal: any) {
  try {
    if (typeof OneSignal?.Notifications?.permission === "boolean") {
      return OneSignal.Notifications.permission
    }
  } catch {
    // Fall back to browser permission below.
  }
  return typeof Notification !== "undefined" ? Notification.permission === "granted" : false
}

async function requestNotificationPermission(OneSignal: any) {
  try {
    if (typeof OneSignal?.Notifications?.requestPermission === "function") {
      await OneSignal.Notifications.requestPermission()
      return readNotificationPermission(OneSignal)
    }
  } catch (error) {
    console.warn("[OneSignal mobile] SDK permission request failed", error)
  }

  if (typeof Notification !== "undefined" && typeof Notification.requestPermission === "function") {
    const result = await Notification.requestPermission()
    return result === "granted"
  }

  return false
}

function readPushSubscription(OneSignal: any) {
  try {
    const user = OneSignal && typeof OneSignal === "object" ? OneSignal.User : null
    const pushSubscription = user && typeof user === "object" ? user.PushSubscription : null
    const oneSignalId = String(pushSubscription?.id || pushSubscription?.token || "")
    const subscribed = Boolean(pushSubscription?.optedIn ?? oneSignalId)
    return {
      oneSignalId,
      subscribed,
      optedIn: pushSubscription?.optedIn,
    }
  } catch (error) {
    console.warn("[OneSignal mobile] Push subscription okunamadı", error)
    return { oneSignalId: "", subscribed: false, optedIn: undefined }
  }
}

export async function syncOneSignalSubscription(personnelId: string, options: { requestPermission: boolean }) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
  if (!appId) {
    throw new Error("NEXT_PUBLIC_ONESIGNAL_APP_ID tanimli degil.")
  }

  assertPushSupported()
  return withOneSignal(async (OneSignal: any) => {
    if (!OneSignal || typeof OneSignal.init !== "function") {
      throw new Error("Bildirim servisi henüz hazır değil, birkaç saniye sonra tekrar deneyin.")
    }

    try {
      console.info("[OneSignal mobile] initialize starting", { appId })
      await OneSignal.init({ appId })
      console.info("[OneSignal mobile] OneSignal initialized")
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!/already initialized/i.test(message)) throw error
      console.info("[OneSignal mobile] OneSignal initialized", { alreadyInitialized: true })
    }

    if (typeof OneSignal.login === "function") {
      await OneSignal.login(personnelId)
      console.info("[OneSignal mobile] external user linked", { personnelId })
    }

    let permission = readNotificationPermission(OneSignal)
    console.info("[OneSignal mobile] Permission current", { permission })
    if (options.requestPermission && !permission) {
      permission = await requestNotificationPermission(OneSignal)
    }
    console.info(`[OneSignal mobile] Permission ${permission ? "granted" : "denied"}`, { permission })

    const subscription = permission
      ? readPushSubscription(OneSignal)
      : { oneSignalId: "", subscribed: false, optedIn: undefined }
    console.info("[OneSignal mobile] Player ID", {
      oneSignalId: subscription.oneSignalId || null,
      subscribed: subscription.subscribed,
      optedIn: subscription.optedIn,
    })

    return {
      oneSignalId: subscription.oneSignalId,
      subscribed: subscription.subscribed,
      permission,
    }
  })
}
