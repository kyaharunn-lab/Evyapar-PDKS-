export const ONESIGNAL_API_URL = "https://onesignal.com/api/v1/notifications"

export type OneSignalAudience =
  | { included_segments: string[]; include_external_user_ids?: never }
  | { include_external_user_ids: string[]; included_segments?: never }

export type OneSignalNotificationInput = OneSignalAudience & {
  title: string
  message: string
  url?: string
  data?: Record<string, unknown>
}

export type OneSignalConfigStatus = {
  configured: boolean
  appId: string | null
  missing: string[]
}

export function getOneSignalConfigStatus(): OneSignalConfigStatus {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ""
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY || ""
  const missing = [
    !appId ? "NEXT_PUBLIC_ONESIGNAL_APP_ID" : "",
    !restApiKey ? "ONESIGNAL_REST_API_KEY" : "",
  ].filter(Boolean)

  return {
    configured: missing.length === 0,
    appId: appId || null,
    missing,
  }
}

export function buildOneSignalPayload(input: OneSignalNotificationInput) {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
  if (!appId) {
    throw new Error("OneSignal App ID eksik: NEXT_PUBLIC_ONESIGNAL_APP_ID env degiskenini Vercel Environment Variables alanina ekleyin.")
  }

  return {
    app_id: appId,
    headings: { tr: input.title, en: input.title },
    contents: { tr: input.message, en: input.message },
    ...(input.url ? { url: input.url } : {}),
    ...(input.data ? { data: input.data } : {}),
    ...(input.included_segments ? { included_segments: input.included_segments } : {}),
    ...(input.include_external_user_ids ? { include_external_user_ids: input.include_external_user_ids } : {}),
  }
}

export function assertOneSignalServerConfig() {
  const status = getOneSignalConfigStatus()
  if (!status.configured) {
    throw new Error(`OneSignal env eksik: ${status.missing.join(", ")}. Vercel Environment Variables alaninda NEXT_PUBLIC_ONESIGNAL_APP_ID ve ONESIGNAL_REST_API_KEY tanimli olmalidir.`)
  }
  return {
    appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID as string,
    restApiKey: process.env.ONESIGNAL_REST_API_KEY as string,
  }
}
