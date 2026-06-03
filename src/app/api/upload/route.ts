import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "application/pdf"])
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

async function uploadBuffer(buffer: Buffer, originalFilename: string, mimeType: string) {
  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "evyapar-pdks/leave-documents",
        resource_type: "auto",
        filename_override: originalFilename,
        use_filename: true,
        unique_filename: true,
        type: "upload",
        context: {
          originalFilename,
          mimeType,
        },
      },
      (error, result) => {
        if (error || !result) reject(error || new Error("Cloudinary upload sonucu bos dondu."))
        else resolve(result)
      }
    )
    stream.end(buffer)
  })
}

export async function POST(request: Request) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    console.error("[cloudinary upload] Missing env", {
      cloudName: Boolean(cloudName),
      apiKey: Boolean(apiKey),
      apiSecret: Boolean(apiSecret),
    })
    return jsonError("Cloudinary ayarlari eksik. Lutfen sunucu env degiskenlerini kontrol edin.", 500)
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })

  try {
    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return jsonError("Dosya bulunamadi.", 400)
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError("Gecersiz dosya tipi. Sadece JPG, PNG veya PDF yukleyebilirsiniz.", 400)
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return jsonError("Dosya boyutu en fazla 5 MB olabilir.", 400)
    }

    const arrayBuffer = await file.arrayBuffer()
    const result = await uploadBuffer(Buffer.from(arrayBuffer), file.name, file.type)

    return NextResponse.json({
      url: result.secure_url || result.url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      originalFilename: file.name,
    })
  } catch (error) {
    console.error("[cloudinary upload] failed", error)
    return jsonError(error instanceof Error ? error.message : "Dosya yuklenirken hata olustu.", 500)
  }
}
