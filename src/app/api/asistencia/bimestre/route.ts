import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Periodo escolar peruano (marzo-diciembre) dividido en 4 bimestres
function bimestreRanges(year: number) {
  return [
    { label: "I Bimestre", start: new Date(year, 2, 1), end: new Date(year, 4, 31) },   // mar-may
    { label: "II Bimestre", start: new Date(year, 5, 1), end: new Date(year, 6, 31) },  // jun-jul
    { label: "III Bimestre", start: new Date(year, 7, 1), end: new Date(year, 8, 30) }, // ago-sep
    { label: "IV Bimestre", start: new Date(year, 9, 1), end: new Date(year, 11, 31) }, // oct-dic
  ]
}

function countStatus(records: { status: string }[]) {
  let present = 0, late = 0, absent = 0
  for (const r of records) {
    if (r.status === "present") present++
    else if (r.status === "late") late++
    else if (r.status === "absent") absent++
  }
  const marked = present + late + absent
  const pct = marked > 0 ? Math.round(((present + late) / marked) * 100) : 0
  return { present, late, absent, marked, pct }
}

// GET /api/asistencia/bimestre?year=YYYY&sectionId=all|<id>
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get("year") ?? "")
  const sectionId = searchParams.get("sectionId")
  if (!year) return NextResponse.json({ error: "Falta el año" }, { status: 400 })

  const ranges = bimestreRanges(year)
  const instId = session.user.institutionId

  const sections = await prisma.section.findMany({
    where: { institutionId: instId, ...(sectionId && sectionId !== "all" ? { id: sectionId } : {}) },
    orderBy: { name: "asc" },
  })

  const result = []
  for (const sec of sections) {
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { institutionId: instId, sectionId: sec.id, active: true },
      include: { student: true },
    })
    const students = enrollments.map(e => e.student)
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))
    if (students.length === 0) continue

    const records = await prisma.attendanceRecord.findMany({
      where: { institutionId: instId, sectionId: sec.id, date: { gte: ranges[0].start, lte: ranges[3].end } },
    })

    const studentsOut = students.map(s => {
      const own = records.filter(r => r.studentId === s.id)
      const b = ranges.map(r => countStatus(own.filter(x => x.date >= r.start && x.date <= r.end)))
      const total = countStatus(own)
      return { studentId: s.id, studentName: `${s.lastName}, ${s.firstName}`, b, total }
    })

    result.push({ id: sec.id, name: sec.name, students: studentsOut })
  }

  return NextResponse.json({ year, labels: ranges.map(r => r.label), sections: result })
}
