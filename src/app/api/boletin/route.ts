import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const LEVEL_RANK: Record<string, number> = { C: 1, B: 2, A: 3, AD: 4 }

// Nivel de logro del área: el literal más frecuente entre sus competencias
// (empate → gana el más bajo, criterio conservador del MINEDU).
function nivelDeLogro(levels: string[]): string {
  const valid = levels.filter(l => LEVEL_RANK[l])
  if (!valid.length) return ""
  const freq = new Map<string, number>()
  for (const l of valid) freq.set(l, (freq.get(l) ?? 0) + 1)
  let best = valid[0], bestCount = 0
  for (const [l, count] of freq) {
    if (count > bestCount || (count === bestCount && LEVEL_RANK[l] < LEVEL_RANK[best])) {
      best = l
      bestCount = count
    }
  }
  return best
}

// GET /api/boletin?studentId=&periodId= → notas por área/competencia del alumno en ese bimestre
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")
  const periodId = searchParams.get("periodId")
  if (!studentId || !periodId) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })

  const instId = session.user.institutionId

  if (session.user.role === "padre") {
    const own = await prisma.studentParent.findFirst({ where: { userId: session.user.id, studentId } })
    if (!own) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, institutionId: instId },
    include: {
      enrollments: { where: { active: true }, include: { section: { include: { grade: true, level: true } } }, take: 1, orderBy: { id: "desc" } },
    },
  })
  if (!student) return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 })

  const enroll = student.enrollments[0]
  const period = await prisma.academicPeriod.findUnique({ where: { id: periodId } })

  // Áreas del nivel donde está matriculado el alumno, con sus competencias.
  const areas = await prisma.area.findMany({
    where: { institutionId: instId, levelId: enroll?.section.levelId ?? undefined },
    include: { competencias: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  })

  const grades = await prisma.competenciaGrade.findMany({
    where: {
      institutionId: instId,
      studentId,
      periodId,
      competenciaId: { in: areas.flatMap(a => a.competencias.map(c => c.id)) },
    },
  })
  const gradeMap = new Map(grades.map(g => [g.competenciaId, g]))

  const areasOut = areas.map(a => {
    const competencias = a.competencias.map(c => {
      const g = gradeMap.get(c.id)
      return {
        id: c.id,
        name: c.name,
        courseLabel: c.courseLabel,
        scores: g ? (JSON.parse(g.scores) as (number | string)[]) : [],
        finalScore: g?.finalScore ?? null,
        level: g?.level ?? "",
      }
    })
    const withData = competencias.filter(c => c.finalScore != null)
    const areaScore = withData.length
      ? Math.round((withData.reduce((sum, c) => sum + (c.finalScore ?? 0), 0) / withData.length) * 10) / 10
      : null
    return {
      id: a.id,
      name: a.name,
      competencias,
      areaScore,
      areaLevel: nivelDeLogro(competencias.map(c => c.level)),
    }
  })

  return NextResponse.json({
    studentName: `${student.lastName}, ${student.firstName}`,
    section: enroll?.section.name ?? "—",
    grade: enroll?.section.grade?.name ?? "",
    level: enroll?.section.level?.name ?? "",
    period: period?.name ?? "",
    areas: areasOut,
    hasAnyGrade: grades.length > 0,
  })
}
