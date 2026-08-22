import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { currentBimestre } from "@/lib/bimestre"

const BASE_SCORE = 20

// GET /api/conducta/resumen?sectionId=&studentId=&year= → puntaje de conducta
// del bimestre actual (o del año dado). Todos parten de 20 y se descuenta lo
// acumulado de faltas con código en ese periodo.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const instId = session.user.institutionId

  const { searchParams } = new URL(req.url)
  const sectionId = searchParams.get("sectionId")
  const studentId = searchParams.get("studentId")
  const year = parseInt(searchParams.get("year") ?? "") || new Date().getFullYear()
  const bim = currentBimestre(new Date(year, new Date().getMonth(), 1))

  let studentIds: string[]
  if (studentId) {
    studentIds = [studentId]
  } else if (sectionId) {
    const enr = await prisma.studentEnrollment.findMany({ where: { institutionId: instId, sectionId, active: true }, include: { student: true } })
    studentIds = enr.map(e => e.studentId)
  } else {
    return NextResponse.json({ error: "Falta sectionId o studentId" }, { status: 400 })
  }

  const students = await prisma.student.findMany({ where: { id: { in: studentIds } }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] })

  const incidents = await prisma.incident.findMany({
    where: { institutionId: instId, studentId: { in: studentIds }, type: "negative", code: { not: null }, date: { gte: bim.start, lte: bim.end } },
  })

  const byStudent = new Map<string, { count: number; deducted: number }>()
  for (const i of incidents) {
    const c = byStudent.get(i.studentId) ?? { count: 0, deducted: 0 }
    c.count++
    c.deducted += Math.abs(i.points ?? 0)
    byStudent.set(i.studentId, c)
  }

  const rows = students.map(s => {
    const c = byStudent.get(s.id) ?? { count: 0, deducted: 0 }
    const score = Math.max(0, BASE_SCORE - c.deducted)
    return { studentId: s.id, studentName: `${s.lastName}, ${s.firstName}`, baseScore: BASE_SCORE, deducted: c.deducted, score, incidentCount: c.count }
  })

  return NextResponse.json({ bimestre: bim.label, year, bimestreStart: bim.start, bimestreEnd: bim.end, baseScore: BASE_SCORE, rows })
}
