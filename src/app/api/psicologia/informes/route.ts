import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { put } from "@vercel/blob"

const ALLOWED = ["director", "coordinador", "psicologo"]

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.institutionId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!ALLOWED.includes(session.user.role ?? "")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const caseId = formData.get("caseId") as string
  const type = (formData.get("type") as string) ?? "diagnostico"
  const name = (formData.get("name") as string) ?? file?.name ?? "informe"

  if (!file || !caseId) return NextResponse.json({ error: "Faltan campos" }, { status: 400 })

  const c = await prisma.psychologicalCase.findFirst({
    where: { id: caseId, institutionId: session.user.institutionId },
  })
  if (!c) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf"
  const filename = `psicologia/${session.user.institutionId}/${caseId}/${Date.now()}.${ext}`

  const blob = await put(filename, file, { access: "public" })

  const report = await prisma.psychologicalReport.create({
    data: {
      caseId,
      name,
      fileUrl: blob.url,
      fileType: ext,
      type,
      uploadedById: session.user.id,
    },
  })

  return NextResponse.json(report, { status: 201 })
}
