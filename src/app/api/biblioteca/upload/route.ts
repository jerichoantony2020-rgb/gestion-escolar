import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export const runtime = "nodejs"

// POST /api/biblioteca/upload  (multipart: file, resourceId?)  → guarda archivo y lo asocia
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const resourceId = formData.get("resourceId") as string | null
  if (!file) return NextResponse.json({ error: "Sin archivo" }, { status: 400 })

  const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Solo se permiten archivos PDF o Word" }, { status: 400 })
  }
  const maxBytes = 20 * 1024 * 1024
  if (file.size > maxBytes) return NextResponse.json({ error: "El archivo supera 20 MB" }, { status: 400 })

  const bytes = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split(".").pop() ?? "bin"
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const dir = path.join(process.cwd(), "public", "biblioteca")
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, safeName), bytes)

  const fileUrl = `/biblioteca/${safeName}`

  if (resourceId) {
    await prisma.libraryResource.update({
      where: { id: resourceId },
      data: { fileUrl, fileName: file.name, fileType: file.type },
    })
  }

  return NextResponse.json({ fileUrl, fileName: file.name, fileType: file.type })
}
