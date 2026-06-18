import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED = ["director", "coordinador", "psicologo"]

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.institutionId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!ALLOWED.includes(session.user.role ?? "")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const { caseId, date, type, summary, nextDate } = await req.json()
  if (!caseId || !date || !summary) return NextResponse.json({ error: "Faltan campos" }, { status: 400 })

  // Verify case belongs to institution
  const c = await prisma.psychologicalCase.findFirst({
    where: { id: caseId, institutionId: session.user.institutionId },
  })
  if (!c) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })

  const session_ = await prisma.psychologicalSession.create({
    data: {
      caseId,
      date: new Date(date),
      type: type ?? "individual",
      summary,
      nextDate: nextDate ? new Date(nextDate) : null,
    },
  })

  return NextResponse.json(session_, { status: 201 })
}
