import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED = ["director", "coordinador", "psicologo"]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.institutionId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const cases = await prisma.psychologicalCase.findMany({
    where: { institutionId: session.user.institutionId },
    include: {
      student: {
        include: {
          enrollments: {
            where: { active: true },
            include: { section: true, grade: true },
            take: 1,
          },
        },
      },
      sessions: { orderBy: { date: "desc" }, take: 1 },
      _count: { select: { sessions: true } },
    },
    orderBy: { openedAt: "desc" },
  })

  return NextResponse.json(cases)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.institutionId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!ALLOWED.includes(session.user.role ?? "")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const { studentId, mainReason, referralSource, notes } = await req.json()
  if (!studentId || !mainReason) return NextResponse.json({ error: "Faltan campos" }, { status: 400 })

  const newCase = await prisma.psychologicalCase.create({
    data: {
      institutionId: session.user.institutionId,
      studentId,
      openedById: session.user.id,
      mainReason,
      referralSource: referralSource ?? "directo",
      notes: notes ?? null,
    },
  })

  return NextResponse.json(newCase, { status: 201 })
}
