import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/asistencia/reporte?month=YYYY-MM&sectionId=all|<id> → matriz de asistencia del mes por aula
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get("month")
  const sectionId = searchParams.get("sectionId")
  if (!month) return NextResponse.json({ error: "Falta el mes" }, { status: 400 })

  const [y, m] = month.split("-").map(Number)
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0)
  const daysInMonth = end.getDate()

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
    const byKey = new Map(records.map(r => [`${r.studentId}|${r.date.getDate()}`, r.status]))

    const studentsOut = students.map(s => {
      const days: Record<string, string> = {}
      let present = 0, late = 0, absent = 0, marked = 0
      for (let d = 1; d <= daysInMonth; d++) {
        const st = byKey.get(`${s.id}|${d}`)
        if (st) {
          days[d] = st
          marked++
          if (st === "present") present++
          else if (st === "late") late++
          else if (st === "absent") absent++
        }
      }
      return {
        studentId: s.id,
        studentName: `${s.lastName}, ${s.firstName}`,
        days, present, late, absent, marked,
      }
    })

    result.push({ id: sec.id, name: sec.name, students: studentsOut })
  }

  return NextResponse.json({ daysInMonth, sections: result })
}
