import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "Sin archivo" }, { status: 400 })

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
  if (!allowed.includes(file.type))
    return NextResponse.json({ error: "Solo se permiten imágenes JPG, PNG, WEBP o GIF" }, { status: 400 })

  const maxBytes = 5 * 1024 * 1024
  if (file.size > maxBytes)
    return NextResponse.json({ error: "La imagen supera 5 MB" }, { status: 400 })

  const bytes = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const dir = path.join(process.cwd(), "public", "uploads")
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, safeName), bytes)

  return NextResponse.json({ url: `/uploads/${safeName}` })
}
