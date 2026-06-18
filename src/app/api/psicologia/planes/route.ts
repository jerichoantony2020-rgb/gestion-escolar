import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED = ["director", "coordinador", "psicologo"]

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.institutionId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!ALLOWED.includes(session.user.role ?? "")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const { caseId, objectives, strategies, status } = await req.json()
  if (!caseId) return NextResponse.json({ error: "Falta caseId" }, { status: 400 })

  const c = await prisma.psychologicalCase.findFirst({
    where: { id: caseId, institutionId: session.user.institutionId },
  })
  if (!c) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })

  const plan = await prisma.interventionPlan.upsert({
    where: { caseId },
    update: {
      objectives: JSON.stringify(objectives ?? []),
      strategies: JSON.stringify(strategies ?? []),
      status: status ?? "en_proceso",
    },
    create: {
      caseId,
      objectives: JSON.stringify(objectives ?? []),
      strategies: JSON.stringify(strategies ?? []),
      status: status ?? "en_proceso",
    },
  })

  return NextResponse.json(plan)
}
