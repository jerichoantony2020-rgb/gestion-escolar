import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { bimestreRanges } from "@/lib/bimestre"

const LEVEL_RANK: Record<string, number> = { C: 1, B: 2, A: 3, AD: 4 }
const RANK_LEVEL = ["", "C", "B", "A", "AD"]
const BASE_CONDUCT = 20

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

function conductLevel(score: number): string {
  if (score >= 18) return "A"
  if (score >= 14) return "B"
  return "C"
}

// GET /api/informe?studentId= → Informe de Progreso consolidado (4 bimestres, formato MINEDU)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const instId = session.user.institutionId

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")
  if (!studentId) return NextResponse.json({ error: "Falta studentId" }, { status: 400 })

  if (session.user.role === "padre") {
    const own = await prisma.studentParent.findFirst({ where: { userId: session.user.id, studentId } })
    if (!own) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const student = await prisma.student.findFirst({
    where: { id: studentId, institutionId: instId },
    include: {
      enrollments: {
        where: { active: true },
        include: { section: { include: { grade: true, level: true } } },
        take: 1,
        orderBy: { id: "desc" },
      },
    },
  })
  if (!student) return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 })
  const enroll = student.enrollments[0]
  if (!enroll) return NextResponse.json({ error: "El alumno no tiene matrícula activa" }, { status: 404 })

  const year = await prisma.institutionYear.findFirst({ where: { institutionId: instId, active: true } })
  if (!year) return NextResponse.json({ error: "No hay año académico activo" }, { status: 404 })

  const periods = await prisma.academicPeriod.findMany({ where: { yearId: year.id }, orderBy: { number: "asc" } })

  const levelId = enroll.section.levelId
  const areas = await prisma.area.findMany({
    where: { institutionId: instId, levelId: levelId ?? undefined },
    include: { competencias: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  })
  const competenciaIds = areas.flatMap(a => a.competencias.map(c => c.id))

  const grades = await prisma.competenciaGrade.findMany({
    where: { institutionId: instId, studentId, competenciaId: { in: competenciaIds } },
  })
  const gradeMap = new Map(grades.map(g => [`${g.competenciaId}|${g.periodId}`, g]))
  const levelOf = (compId: string, periodId: string) => gradeMap.get(`${compId}|${periodId}`)?.level ?? ""

  const areasOut = areas.map(a => ({
    id: a.id,
    name: a.name,
    competencias: a.competencias.map(c => ({
      id: c.id,
      name: c.name,
      levels: periods.map(p => levelOf(c.id, p.id)),
      scores: periods.map(p => {
        const g = gradeMap.get(`${c.id}|${p.id}`)
        return g ? { scores: JSON.parse(g.scores) as (number | string)[], finalScore: g.finalScore } : { scores: [], finalScore: null }
      }),
    })),
    nivelPorBimestre: periods.map(p =>
      nivelDeLogro(a.competencias.map(c => levelOf(c.id, p.id)))
    ),
  }))

  // ── Asistencia por bimestre ──
  const ranges = bimestreRanges(year.year)
  const attendance = await prisma.attendanceRecord.findMany({
    where: { institutionId: instId, studentId, date: { gte: ranges[0].start, lte: ranges[3].end } },
  })
  const asistenciaPorBimestre = ranges.map(r => {
    const own = attendance.filter(a => a.date >= r.start && a.date <= r.end)
    const dias = own.length
    const justificadas = own.filter(a => a.status === "absent" && a.note).length
    const injustificadas = own.filter(a => a.status === "absent" && !a.note).length
    return { dias, justificadas, injustificadas, inasistencias: justificadas + injustificadas }
  })

  // ── Comportamiento (derivado del puntaje de conducta) ──
  const incidents = await prisma.incident.findMany({
    where: { institutionId: instId, studentId, type: "negative", code: { not: null }, date: { gte: ranges[0].start, lte: ranges[3].end } },
  })
  const comportamientoPorBimestre = ranges.map(r => {
    const deducted = incidents
      .filter(i => i.date >= r.start && i.date <= r.end)
      .reduce((sum, i) => sum + Math.abs(i.points ?? 0), 0)
    const score = Math.max(0, BASE_CONDUCT - deducted)
    return { score, level: conductLevel(score) }
  })

  // ── Conclusión descriptiva del tutor ──
  const notes = await prisma.tutorNote.findMany({ where: { institutionId: instId, studentId, periodId: { in: periods.map(p => p.id) } } })
  const noteMap = new Map(notes.map(n => [n.periodId, n.text]))
  const conclusiones = periods.map(p => ({ periodId: p.id, label: p.name, text: noteMap.get(p.id) ?? "" }))

  const director = await prisma.user.findFirst({
    where: { institutionId: instId, active: true, roles: { some: { role: { name: "director" } } } },
    orderBy: { id: "asc" },
  })
  const ugelCfg = await prisma.institutionConfig.findUnique({ where: { institutionId_key: { institutionId: instId, key: "ugel" } } })
  const institution = await prisma.institution.findUnique({ where: { id: instId } })

  return NextResponse.json({
    studentName: `${student.lastName}, ${student.firstName}`,
    nivel: enroll.section.level?.name ?? "",
    grado: enroll.section.grade?.name ?? "",
    seccion: enroll.section.name,
    year: year.year,
    ugel: ugelCfg?.value ?? "",
    institutionName: institution?.name ?? "",
    directorName: director?.name ?? "",
    periods: periods.map(p => ({ id: p.id, name: p.name, number: p.number })),
    areas: areasOut,
    asistencia: asistenciaPorBimestre,
    comportamiento: comportamientoPorBimestre,
    conclusiones,
  })
}
