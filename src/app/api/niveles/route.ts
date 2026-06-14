import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/niveles → niveles con sus grados
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const levels = await prisma.level.findMany({
    where: { institutionId: session.user.institutionId },
    include: { grades: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  })
  return NextResponse.json(levels)
}

// POST /api/niveles → crear nivel o grado. body {type:'level', name} | {type:'grade', levelId, name}
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const instId = session.user.institutionId
  const b = await req.json()

  if (b.type === "level") {
    const count = await prisma.level.count({ where: { institutionId: instId } })
    const level = await prisma.level.create({ data: { institutionId: instId, name: b.name, order: count + 1 } })
    return NextResponse.json(level, { status: 201 })
  }
  if (b.type === "grade") {
    const count = await prisma.grade.count({ where: { institutionId: instId, levelId: b.levelId } })
    const grade = await prisma.grade.create({ data: { institutionId: instId, levelId: b.levelId, name: b.name, order: count + 1 } })
    return NextResponse.json(grade, { status: 201 })
  }
  return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
}
