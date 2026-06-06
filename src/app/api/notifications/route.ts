import { NextResponse } from "next/server"
import {
  ONESIGNAL_API_URL,
  assertOneSignalServerConfig,
  getOneSignalConfigStatus,
  type OneSignalNotificationInput,
} from "@/lib/onesignal"

type NotificationRequest = Partial<OneSignalNotificationInput> & {
  include_subscription_ids?: string[]
  oneSignalSubscriptionId?: string
  personnel?: {
    oneSignalSubscriptionId?: string
  }
}

function jsonError(message: string, status: number, details?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(details || {}) }, { status })
}

function getSubscriptionIds(body: NotificationRequest) {
  const directIds = Array.isArray(body.include_subscription_ids) ? body.include_subscription_ids : []
  const singleId = body.oneSignalSubscriptionId || body.personnel?.oneSignalSubscriptionId || ""
  return [...directIds, singleId].map((id) => String(id || "").trim()).filter(Boolean)
}

function isValidAudience(body: NotificationRequest) {
  const hasSegments = Array.isArray(body.included_segments) && body.included_segments.length > 0
  const hasExternalUsers = Array.isArray(body.include_external_user_ids) && body.include_external_user_ids.length > 0
  const hasSubscriptions = getSubscriptionIds(body).length > 0
  if (hasSegments) return true
  return [hasExternalUsers, hasSubscriptions].filter(Boolean).length === 1
}

function buildPayload(body: NotificationRequest, appId: string) {
  const hasSegments = Array.isArray(body.included_segments) && body.included_segments.length > 0
  const subscriptionIds = getSubscriptionIds(body)

  return {
    app_id: appId,
    headings: { tr: body.title, en: body.title },
    contents: { tr: body.message, en: body.message },
    ...(body.url ? { url: body.url } : {}),
    ...(body.data ? { data: body.data } : {}),
    ...(hasSegments ? { included_segments: ["Subscribed Users"] } : {}),
    ...(!hasSegments && subscriptionIds.length > 0 ? { include_subscription_ids: subscriptionIds } : {}),
    ...(!hasSegments && subscriptionIds.length === 0 && body.include_external_user_ids ? { include_external_user_ids: body.include_external_user_ids } : {}),
  }
}

function normalizeOneSignalResult(result: any, status: number) {
  const recipients = Number(result?.recipients ?? result?.successful ?? 0) || 0
  const errors = result?.errors || result?.error || null

  return {
    oneSignalStatus: status,
    id: typeof result?.id === "string" ? result.id : null,
    oneSignalId: typeof result?.id === "string" ? result.id : null,
    recipients,
    errors,
  }
}

export async function GET() {
  const status = getOneSignalConfigStatus()
  return NextResponse.json({
    provider: "onesignal",
    configured: status.configured,
    appId: status.appId,
    missing: status.missing,
    mode: "send",
  })
}

export async function POST(request: Request) {
  let body: NotificationRequest

  try {
    body = await request.json()
  } catch {
    return jsonError("Gecersiz JSON gonderildi.", 400)
  }

  if (!body.title || !body.message) {
    return jsonError("title ve message zorunludur.", 400)
  }

  if (!isValidAudience(body)) {
    return jsonError("included_segments, include_external_user_ids veya include_subscription_ids alanlarindan yalnizca biri zorunludur.", 400)
  }

  try {
    const config = assertOneSignalServerConfig()
    const payload = buildPayload(body, config.appId)
    const response = await fetch(ONESIGNAL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${config.restApiKey}`,
      },
      body: JSON.stringify(payload),
    })
    const result = await response.json().catch(() => ({}))
    const debug = normalizeOneSignalResult(result, response.status)

    if (!response.ok) {
      console.error("[onesignal notifications] send error", result)
      return jsonError("OneSignal bildirimi gonderilemedi.", response.status || 500, {
        ...debug,
      })
    }

    return NextResponse.json({
      provider: "onesignal",
      success: true,
      message: debug.recipients === 0 ? "Abone var ama hedef eslesmedi." : "OneSignal bildirimi gonderildi.",
      ...debug,
    }, { status: 200 })
  } catch (error) {
    console.error("[onesignal notifications] config error", error)
    return jsonError(error instanceof Error ? error.message : "OneSignal ayarlari kontrol edilemedi.", 500)
  }
}
