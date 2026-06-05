"use client"

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: any) => void | Promise<void>>
    OneSignal?: any
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

  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  const isSecure = window.isSecureContext || isLocalhost
  const supported = isSecure && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window

  if (!supported) {
    throw new Error("Bildirimler bu tarayıcıda desteklenmiyor olabilir.")
  }
}

function waitForOneSignalReady(timeoutMs = 10000) {
  return new Promise<any>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Bildirimler bu tarayıcıda desteklenmiyor olabilir."))
      return
    }

    let settled = false
    const finish = (oneSignal: any) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      if (oneSignal) resolve(oneSignal)
      else reject(new Error("OneSignal SDK hazır değil."))
    }
    const timer = window.setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error("OneSignal SDK zaman aşımına uğradı."))
    }, timeoutMs)

    if (window.OneSignal) {
      window.setTimeout(() => finish(window.OneSignal), 0)
      return
    }

    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push((oneSignal: any) => finish(oneSignal))
  })
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
    const pushSubscription = OneSignal?.User?.PushSubscription
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
  const sdkLoaded = await loadOneSignalSdk()
  if (!sdkLoaded) {
    throw new Error("OneSignal SDK yuklenemedi.")
  }

  const OneSignal = await waitForOneSignalReady()
  if (!OneSignal) {
    throw new Error("OneSignal SDK hazır değil.")
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

  const subscription = readPushSubscription(OneSignal)
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
}
