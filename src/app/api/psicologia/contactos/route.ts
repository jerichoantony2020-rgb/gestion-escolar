import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED = ["director", "coordinador", "psicologo"]

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.institutionId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!ALLOWED.includes(session.user.role ?? "")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const { caseId, channel, summary } = await req.json()
  if (!caseId || !summary) return NextResponse.json({ error: "Faltan campos" }, { status: 400 })

  const c = await prisma.psychologicalCase.findFirst({
    where: { id: caseId, institutionId: session.user.institutionId },
  })
  if (!c) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })

  const contact = await prisma.psychologicalContact.create({
    data: { caseId, channel: channel ?? "whatsapp", summary },
  })

  return NextResponse.json(contact, { status: 201 })
}
