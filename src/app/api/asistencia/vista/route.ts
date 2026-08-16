import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// GET /api/asistencia/vista?scope=semana|mes&start=YYYY-MM-DD&sectionId=all|<id>
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const scope = searchParams.get("scope") === "semana" ? "semana" : "mes"
  const startStr = searchParams.get("start")
  const sectionId = searchParams.get("sectionId")
  if (!startStr) return NextResponse.json({ error: "Falta la fecha" }, { status: 400 })

  const startDate = new Date(startStr + "T00:00:00")
  const dates: Date[] = []

  if (scope === "semana") {
    const dow = startDate.getDay()
    const diffToMonday = dow === 0 ? -6 : 1 - dow
    const monday = new Date(startDate)
    monday.setDate(startDate.getDate() + diffToMonday)
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      dates.push(d)
    }
  } else {
    const y = startDate.getFullYear()
    const m = startDate.getMonth()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(y, m, day)
      if (d.getDay() >= 1 && d.getDay() <= 5) dates.push(d)
    }
  }

  const rangeStart = dates[0]
  const rangeEnd = dates[dates.length - 1]
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
      where: { institutionId: instId, sectionId: sec.id, date: { gte: rangeStart, lte: rangeEnd } },
    })
    const byKey = new Map(records.map(r => [`${r.studentId}|${ymd(r.date)}`, r.status]))

    const studentsOut = students.map(s => {
      const marks: Record<string, string> = {}
      let present = 0, late = 0, absent = 0
      for (const d of dates) {
        const st = byKey.get(`${s.id}|${ymd(d)}`)
        if (st) {
          marks[ymd(d)] = st
          if (st === "present") present++
          else if (st === "late") late++
          else if (st === "absent") absent++
        }
      }
      const marked = present + late + absent
      const pct = marked > 0 ? Math.round(((present + late) / marked) * 100) : 0
      return { studentId: s.id, studentName: `${s.lastName}, ${s.firstName}`, marks, present, late, absent, marked, pct }
    })

    result.push({ id: sec.id, name: sec.name, students: studentsOut })
  }

  return NextResponse.json({ dates: dates.map(ymd), sections: result })
}
