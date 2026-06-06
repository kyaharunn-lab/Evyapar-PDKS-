"use client"

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: any) => void | Promise<void>>
    __evyaparOneSignalScriptLoading?: boolean
  }
}

const ONESIGNAL_SDK_SRC = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"

function supportMessage() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "Bildirimler bu tarayıcıda desteklenmiyor olabilir."
  }

  const userAgent = navigator.userAgent || ""
  const isIos = /iPad|iPhone|iPod/.test(userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as any).standalone)
  if (isIos && !isStandalone) {
    return "Bildirimler için uygulamayı ana ekrana eklemeniz gerekebilir."
  }

  const isLocalhost = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  const isSecure = window.isSecureContext || isLocalhost
  if (!isSecure || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "Bildirimler bu tarayıcıda desteklenmiyor olabilir."
  }

  return ""
}

function loadOneSignalSdk() {
  if (typeof window === "undefined") return Promise.resolve(false)
  window.OneSignalDeferred = window.OneSignalDeferred || []

  const existing = document.querySelector(`script[src="${ONESIGNAL_SDK_SRC}"]`)
  if (existing) return Promise.resolve(true)
  if (window.__evyaparOneSignalScriptLoading) return Promise.resolve(true)

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

async function runWithOneSignal<T>(callback: (oneSignal: any) => Promise<T>, timeoutMs = 8000) {
  if (typeof window === "undefined") {
    throw new Error("Bildirimler bu tarayıcıda desteklenmiyor olabilir.")
  }

  window.OneSignalDeferred = window.OneSignalDeferred || []

  const ready = new Promise<T>((resolve, reject) => {
    let settled = false
    const timer = window.setTimeout(() => {
      if (settled) return
      settled = true
      reject(new Error("Bildirim servisi henüz hazır değil, birkaç saniye sonra tekrar deneyin."))
    }, timeoutMs)

    window.OneSignalDeferred?.push(async function (OneSignal: any) {
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

  return ready
}

async function requestPermissionWithPublicApi(OneSignal: any, shouldRequest: boolean) {
  const current = typeof Notification !== "undefined" ? Notification.permission : "default"
  console.info("[OneSignal mobile] Permission current", { permission: current })

  if (!shouldRequest || current === "granted") return current === "granted"
  if (current === "denied") return false

  try {
    if (typeof OneSignal?.Notifications?.requestPermission === "function") {
      await OneSignal.Notifications.requestPermission()
    } else if (typeof Notification !== "undefined" && typeof Notification.requestPermission === "function") {
      await Notification.requestPermission()
    }
  } catch (error) {
    console.warn("[OneSignal mobile] permission request failed", error)
    throw new Error("Bildirim servisi henüz hazır değil, birkaç saniye sonra tekrar deneyin.")
  }

  return typeof Notification !== "undefined" && Notification.permission === "granted"
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

async function readPushSubscription(OneSignal: any) {
  const subscription = OneSignal?.User?.PushSubscription
  return {
    subscriptionId: String(subscription?.id || ""),
    subscriptionToken: String(subscription?.token || ""),
    optedIn: Boolean(subscription?.optedIn),
  }
}

async function readSubscriptionId(OneSignal: any) {
  try {
    if (typeof OneSignal?.User?.PushSubscription?.optIn === "function") {
      await OneSignal.User.PushSubscription.optIn()
      console.info("[OneSignal mobile] PushSubscription optIn called")
    }
  } catch (error) {
    console.warn("[OneSignal mobile] subscription opt-in failed", error)
  }

  try {
    const oneSignalUserId = String(
      OneSignal?.User?.onesignalId ||
      OneSignal?.User?.onesignal_id ||
      (typeof OneSignal?.User?.getOnesignalId === "function" ? await OneSignal.User.getOnesignalId() : "") ||
      ""
    )
    let subscription = await readPushSubscription(OneSignal)

    for (let attempt = 0; attempt < 6 && !subscription.subscriptionId; attempt += 1) {
      await wait(500)
      subscription = await readPushSubscription(OneSignal)
    }

    const subscribed = Boolean(subscription.subscriptionId)
    console.info("[OneSignal mobile] Subscription id", {
      oneSignalId: oneSignalUserId || null,
      subscriptionId: subscription.subscriptionId || null,
      subscriptionToken: subscription.subscriptionToken ? "var" : "yok",
      optedIn: subscription.optedIn,
      subscribed,
    })
    return {
      oneSignalId: oneSignalUserId || subscription.subscriptionId,
      subscriptionId: subscription.subscriptionId,
      subscriptionToken: subscription.subscriptionToken,
      subscribed,
    }
  } catch (error) {
    console.warn("[OneSignal mobile] subscription id okunamadı", error)
    console.info("[OneSignal mobile] Subscription id", { oneSignalId: null, subscriptionId: null, subscribed: false })
    return { oneSignalId: "", subscriptionId: "", subscriptionToken: "", subscribed: false }
  }
}

export async function syncOneSignalSubscription(personnelId: string, options: { requestPermission: boolean }) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
  if (!appId) {
    throw new Error("NEXT_PUBLIC_ONESIGNAL_APP_ID tanimli degil.")
  }

  const unsupported = supportMessage()
  if (unsupported) throw new Error(unsupported)

  return runWithOneSignal(async function (OneSignal: any) {
    if (!OneSignal || typeof OneSignal.init !== "function") {
      throw new Error("Bildirim servisi henüz hazır değil, birkaç saniye sonra tekrar deneyin.")
    }

    try {
      await OneSignal.init({
        appId,
        serviceWorkerParam: { scope: "/" },
        serviceWorkerPath: "OneSignalSDKWorker.js",
      })
      console.info("[OneSignal mobile] OneSignal initialized")
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (!/already initialized/i.test(message)) throw error
      console.info("[OneSignal mobile] OneSignal initialized", { alreadyInitialized: true })
    }

    try {
      if (typeof OneSignal.login === "function") {
        await OneSignal.login(personnelId)
        console.info("[OneSignal mobile] external user linked", { personnelId })
      }
    } catch (error) {
      console.warn("[OneSignal mobile] external user link failed", error)
    }

    const permission = await requestPermissionWithPublicApi(OneSignal, options.requestPermission)
    console.info(`[OneSignal mobile] Permission ${permission ? "granted" : "denied"}`, { permission })

    const subscription = permission ? await readSubscriptionId(OneSignal) : { oneSignalId: "", subscriptionId: "", subscriptionToken: "", subscribed: false }

    return {
      sdkReady: true,
      oneSignalId: subscription.oneSignalId,
      oneSignalSubscriptionId: subscription.subscriptionId,
      oneSignalSubscriptionToken: subscription.subscriptionToken,
      subscribed: subscription.subscribed,
      permission,
    }
  })
}
