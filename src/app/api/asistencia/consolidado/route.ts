import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/asistencia/consolidado?year=YYYY&sectionId=all|<id> → totales anuales por alumno y aula
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const yearStr = searchParams.get("year")
  const sectionId = searchParams.get("sectionId")
  if (!yearStr) return NextResponse.json({ error: "Falta el año" }, { status: 400 })
  const year = parseInt(yearStr)

  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31, 23, 59, 59)
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
      where: { institutionId: instId, sectionId: sec.id, date: { gte: start, lte: end } },
    })
    const byStudent = new Map<string, { present: number; late: number; absent: number }>()
    for (const r of records) {
      const c = byStudent.get(r.studentId) ?? { present: 0, late: 0, absent: 0 }
      if (r.status === "present") c.present++
      else if (r.status === "late") c.late++
      else if (r.status === "absent") c.absent++
      byStudent.set(r.studentId, c)
    }

    const studentsOut = students.map(s => {
      const c = byStudent.get(s.id) ?? { present: 0, late: 0, absent: 0 }
      const marked = c.present + c.late + c.absent
      const pct = marked > 0 ? Math.round(((c.present + c.late) / marked) * 100) : 0
      return { studentId: s.id, studentName: `${s.lastName}, ${s.firstName}`, ...c, marked, pct }
    })

    result.push({ id: sec.id, name: sec.name, students: studentsOut })
  }

  return NextResponse.json({ year, sections: result })
}
