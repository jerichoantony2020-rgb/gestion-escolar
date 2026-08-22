import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/notas/area?courseId=&sectionId=&periodId=
// → competencias del curso + nivel (AD/A/B/C) de cada alumno de la sección en ese bimestre.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const instId = session.user.institutionId

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get("courseId")
  const sectionId = searchParams.get("sectionId")
  const periodId = searchParams.get("periodId")
  if (!courseId || !sectionId || !periodId) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })

  const competencias = await prisma.competencia.findMany({
    where: { courseId },
    include: { area: true },
    orderBy: { order: "asc" },
  })

  const enrollments = await prisma.studentEnrollment.findMany({
    where: { institutionId: instId, sectionId, active: true },
    include: { student: true },
  })
  const students = enrollments
    .map(e => e.student)
    .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))

  const grades = await prisma.competenciaGrade.findMany({
    where: { institutionId: instId, periodId, competenciaId: { in: competencias.map(c => c.id) }, studentId: { in: students.map(s => s.id) } },
  })
  const gradeMap = new Map(grades.map(g => [`${g.studentId}|${g.competenciaId}`, g.level]))

  const rows = students.map(s => ({
    studentId: s.id,
    studentName: `${s.lastName}, ${s.firstName}`,
    levels: competencias.map(c => gradeMap.get(`${s.id}|${c.id}`) ?? ""),
  }))

  return NextResponse.json({
    areaName: competencias[0]?.area.name ?? "",
    competencias: competencias.map(c => ({ id: c.id, name: c.name })),
    rows,
  })
}

// POST { courseId, sectionId, periodId, records: [{ studentId, competenciaId, level }] }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const instId = session.user.institutionId

  const body = await req.json()
  const { periodId, records } = body as { periodId: string; records: { studentId: string; competenciaId: string; level: string }[] }
  if (!periodId || !Array.isArray(records)) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  const staff = await prisma.staff.findFirst({ where: { userId: session.user.id } })

  for (const r of records) {
    if (!r.level) continue
    await prisma.competenciaGrade.upsert({
      where: { studentId_competenciaId_periodId: { studentId: r.studentId, competenciaId: r.competenciaId, periodId } },
      update: { level: r.level, staffId: staff?.id },
      create: { institutionId: instId, studentId: r.studentId, competenciaId: r.competenciaId, periodId, level: r.level, staffId: staff?.id },
    })
  }

  return NextResponse.json({ ok: true })
}
