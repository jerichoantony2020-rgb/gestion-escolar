import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/aulas → aulas con nivel y grados que cubren (+ conteo de alumnos)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const instId = session.user.institutionId

  const sections = await prisma.section.findMany({
    where: { institutionId: instId },
    include: {
      level: true,
      grade: true,
      sectionGrades: { include: { grade: true } },
      _count: { select: { enrollments: { where: { active: true } } } },
    },
  })

  const rows = sections.map(s => ({
    id: s.id,
    name: s.name,
    poligrado: s.poligrado,
    levelId: s.levelId,
    levelName: s.level?.name ?? "—",
    levelOrder: s.level?.order ?? 99,
    grades: s.sectionGrades.map(sg => sg.grade.name).sort(),
    gradeIds: s.sectionGrades.map(sg => sg.gradeId),
    students: s._count.enrollments,
  })).sort((a, b) => a.levelOrder - b.levelOrder || a.name.localeCompare(b.name))

  return NextResponse.json(rows)
}

// POST /api/aulas  body {levelId, name, gradeIds:[...]}
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const instId = session.user.institutionId
  const { levelId, name, gradeIds } = await req.json()

  if (!levelId || !name || !Array.isArray(gradeIds) || gradeIds.length === 0) {
    return NextResponse.json({ error: "Faltan datos (nivel, nombre y al menos un grado)" }, { status: 400 })
  }

  const poligrado = gradeIds.length > 1
  const primaryGrade = gradeIds[0]

  const section = await prisma.section.create({
    data: { institutionId: instId, levelId, name, gradeId: primaryGrade, poligrado },
  })
  for (const gid of gradeIds) {
    await prisma.sectionGrade.create({ data: { sectionId: section.id, gradeId: gid } })
  }

  return NextResponse.json(section, { status: 201 })
}
