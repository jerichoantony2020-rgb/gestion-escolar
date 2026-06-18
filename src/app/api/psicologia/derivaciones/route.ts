import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.institutionId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const role = session.user.role ?? ""
  if (!["director", "coordinador", "psicologo", "docente"].includes(role))
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const where: Record<string, unknown> = { institutionId: session.user.institutionId }
  // Docentes only see their own derivations
  if (role === "docente") where.requestedById = session.user.id

  const derivations = await prisma.psychologicalDerivation.findMany({
    where,
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
      requestedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(derivations)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.institutionId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { studentId, reason } = await req.json()
  if (!studentId || !reason) return NextResponse.json({ error: "Faltan campos" }, { status: 400 })

  const derivation = await prisma.psychologicalDerivation.create({
    data: {
      institutionId: session.user.institutionId,
      studentId,
      requestedById: session.user.id,
      reason,
    },
  })

  return NextResponse.json(derivation, { status: 201 })
}
