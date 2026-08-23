import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { currentBimestre } from "@/lib/bimestre"

const CONDUCT_BASE_SCORE = 20

// GET /api/portal → datos de los hijos del apoderado: notas, conducta, asistencia diaria, pagos
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const instId = session.user.institutionId
  const links = await prisma.studentParent.findMany({
    where: { institutionId: instId, userId: session.user.id },
    include: {
      student: {
        include: { enrollments: { where: { active: true }, include: { section: { include: { grade: true, level: true } } }, take: 1, orderBy: { id: "desc" } } },
      },
    },
  })

  const now = new Date()
  const year = now.getFullYear(), month = now.getMonth() + 1
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 1)

  const children = []
  for (const link of links) {
    const s = link.student
    const enroll = s.enrollments[0]

    // Notas por competencia (formato MINEDU). El padre ve el área a la que
    // pertenece cada competencia, con su vigesimal y su literal.
    const grades = await prisma.competenciaGrade.findMany({
      where: { institutionId: instId, studentId: s.id },
      include: { competencia: { include: { area: true } }, period: true },
      orderBy: { period: { number: "desc" } },
    })

    const att = await prisma.attendanceRecord.findMany({
      where: { institutionId: instId, studentId: s.id, date: { gte: monthStart, lt: monthEnd } },
      orderBy: { date: "desc" },
    })
    const present = att.filter(a => a.status === "present").length
    const late = att.filter(a => a.status === "late").length
    const absent = att.filter(a => a.status === "absent").length

    const incidents = await prisma.incident.findMany({
      where: { institutionId: instId, studentId: s.id },
      orderBy: { date: "desc" },
      take: 20,
    })

    const bim = currentBimestre()
    const bimestreDeducted = incidents
      .filter(i => i.type === "negative" && i.points != null && i.date >= bim.start && i.date <= bim.end)
      .reduce((sum, i) => sum + Math.abs(i.points ?? 0), 0)
    const conductScore = Math.max(0, CONDUCT_BASE_SCORE - bimestreDeducted)

    const orders = await prisma.paymentOrder.findMany({
      where: { institutionId: instId, studentId: s.id },
      include: { payments: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    })

    children.push({
      studentId: s.id,
      studentName: `${s.firstName} ${s.lastName}`,
      level: enroll?.section.level?.name ?? "",
      section: enroll ? (enroll.section.poligrado ? enroll.section.name : `${enroll.section.grade?.name ?? ""} "${enroll.section.name}"`) : "—",
      grades: grades.map(g => ({
        area: g.competencia.area.name,
        course: g.competencia.courseLabel ?? g.competencia.name,
        competencia: g.competencia.name,
        periodId: g.periodId,
        periodNumber: g.period.number,
        period: g.period.name,
        score: g.finalScore,
        level: g.level,
        display: g.finalScore != null ? `${g.finalScore} (${g.level})` : (g.level || "—"),
      })),
      attendance: { present, late, absent, total: att.length },
      attendanceDaily: att.slice(0, 15).map(a => ({
        date: a.date, status: a.status,
        entryAt: a.entryAt, exitAt: a.exitAt,
      })),
      conductScore, conductBimestre: bim.label,
      conducta: incidents.map(i => ({ id: i.id, type: i.type, title: i.title, description: i.description, severity: i.severity, code: i.code, points: i.points, date: i.date })),
      payments: orders.map(o => ({ month: o.month, year: o.year, amount: o.amount, status: o.status, paid: o.payments.reduce((p, x) => p + x.amount, 0) })),
    })
  }

  return NextResponse.json({ children })
}
