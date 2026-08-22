import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST { studentId, periodId, text } → guarda la conclusión descriptiva del tutor para ese bimestre.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.role === "padre") return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  const instId = session.user.institutionId

  const { studentId, periodId, text } = await req.json()
  if (!studentId || !periodId) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })

  const staff = await prisma.staff.findFirst({ where: { userId: session.user.id } })

  await prisma.tutorNote.upsert({
    where: { studentId_periodId: { studentId, periodId } },
    update: { text: text ?? "", staffId: staff?.id },
    create: { institutionId: instId, studentId, periodId, text: text ?? "", staffId: staff?.id },
  })

  return NextResponse.json({ ok: true })
}
