import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { bimestreRanges } from "@/lib/bimestre"

/**
 * Cuenta el bloque de un alumno.
 *
 * `diasDeClase` son los días en que el aula tuvo actividad: si ese día se
 * registró a alguien, hubo clase. Un alumno sin registro en un día de clase
 * faltó — no hace falta marcarlo, la ausencia se deduce del silencio.
 */
function countStatus(records: { status: string; date: Date }[], diasDeClase: Set<number>) {
  let present = 0, late = 0, absent = 0
  const conRegistro = new Set<number>()
  for (const r of records) {
    conRegistro.add(r.date.getTime())
    if (r.status === "present") present++
    else if (r.status === "late") late++
    else if (r.status === "absent") absent++
  }
  let sinRegistro = 0
  for (const d of diasDeClase) if (!conRegistro.has(d)) sinRegistro++
  absent += sinRegistro

  const marked = present + late + absent
  const pct = marked > 0 ? Math.round(((present + late) / marked) * 100) : 0
  return { present, late, absent, marked, pct, faltasAutomaticas: sinRegistro }
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

    // Días en que este aula tuvo actividad: definen qué es un día de clase.
    const diasDelAula = new Set(records.map(r => r.date.getTime()))
    const diasPorBimestre = ranges.map(r =>
      new Set([...diasDelAula].filter(t => t >= r.start.getTime() && t <= r.end.getTime()))
    )

    const studentsOut = students.map(s => {
      const own = records.filter(r => r.studentId === s.id)
      const b = ranges.map((r, i) => countStatus(own.filter(x => x.date >= r.start && x.date <= r.end), diasPorBimestre[i]))
      const total = countStatus(own, diasDelAula)
      return { studentId: s.id, studentName: `${s.lastName}, ${s.firstName}`, b, total }
    })

    result.push({ id: sec.id, name: sec.name, students: studentsOut })
  }

  return NextResponse.json({ year, labels: ranges.map(r => r.label), sections: result })
}
