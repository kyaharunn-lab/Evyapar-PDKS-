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
    mode: "dry-run",
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
    assertOneSignalServerConfig()
    const payload = buildOneSignalPayload(body as OneSignalNotificationInput)

    return NextResponse.json({
      provider: "onesignal",
      dryRun: true,
      message: "OneSignal bildirimi hazirlandi; gercek gonderim bu fazda devre disi.",
      payload,
    }, { status: 202 })
  } catch (error) {
    console.error("[onesignal notifications] config error", error)
    return jsonError(error instanceof Error ? error.message : "OneSignal ayarlari kontrol edilemedi.", 500)
  }
}
