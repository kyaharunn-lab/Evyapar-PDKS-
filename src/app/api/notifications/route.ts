import { NextResponse } from "next/server"
import {
  assertOneSignalServerConfig,
  buildOneSignalPayload,
  getOneSignalConfigStatus,
  type OneSignalNotificationInput,
} from "@/lib/onesignal"

function jsonError(message: string, status: number, details?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...(details || {}) }, { status })
}

function isValidAudience(body: Partial<OneSignalNotificationInput>) {
  const hasSegments = Array.isArray(body.included_segments) && body.included_segments.length > 0
  const hasExternalUsers = Array.isArray(body.include_external_user_ids) && body.include_external_user_ids.length > 0
  return hasSegments !== hasExternalUsers
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
  let body: Partial<OneSignalNotificationInput>

  try {
    body = await request.json()
  } catch {
    return jsonError("Gecersiz JSON gonderildi.", 400)
  }

  if (!body.title || !body.message) {
    return jsonError("title ve message zorunludur.", 400)
  }

  if (!isValidAudience(body)) {
    return jsonError("included_segments veya include_external_user_ids alanlarindan yalnizca biri zorunludur.", 400)
  }

  try {
    const config = assertOneSignalServerConfig()
    const payload = buildOneSignalPayload(body as OneSignalNotificationInput)
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${config.restApiKey}`,
      },
      body: JSON.stringify(payload),
    })
    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error("[onesignal notifications] send error", result)
      return jsonError("OneSignal bildirimi gonderilemedi.", response.status || 500, { details: result })
    }

    return NextResponse.json({
      provider: "onesignal",
      success: true,
      message: "OneSignal bildirimi gonderildi.",
      payload,
      result,
    }, { status: 200 })
  } catch (error) {
    console.error("[onesignal notifications] config error", error)
    return jsonError(error instanceof Error ? error.message : "OneSignal ayarlari kontrol edilemedi.", 500)
  }
}
