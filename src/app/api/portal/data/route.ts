import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest) {
  const store = await cookies()
  const code = store.get("cr_portal")?.value
  if (!code) return NextResponse.json({ error: "Sin sesión" }, { status: 401 })

  const parent = await prisma.studentParent.findUnique({
    where: { portalCode: code },
    include: {
      student: {
        include: {
          enrollments: {
            where: { active: true },
            include: { section: { include: { grade: { include: { level: true } }, level: true } } },
            take: 1,
            orderBy: { id: "desc" },
          },
        },
      },
    },
  })

  if (!parent) return NextResponse.json({ error: "Código inválido" }, { status: 401 })

  const s = parent.student
  const instId = parent.institutionId
  const enroll = s.enrollments[0]

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 1)

  const [grades, att, incidents, orders] = await Promise.all([
    // Notas por competencia (formato MINEDU), agrupadas por su área.
    prisma.competenciaGrade.findMany({
      where: { institutionId: instId, studentId: s.id },
      include: { competencia: { include: { area: true } }, period: true },
      orderBy: { period: { number: "desc" } },
    }),
    prisma.attendanceRecord.findMany({
      where: { institutionId: instId, studentId: s.id, date: { gte: monthStart, lt: monthEnd } },
      orderBy: { date: "desc" },
    }),
    prisma.incident.findMany({
      where: { institutionId: instId, studentId: s.id },
      orderBy: { date: "desc" },
      take: 20,
    }),
    prisma.paymentOrder.findMany({
      where: { institutionId: instId, studentId: s.id },
      include: { payments: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
  ])

  const present = att.filter(a => a.status === "present").length
  const late = att.filter(a => a.status === "late").length
  const absent = att.filter(a => a.status === "absent").length

  const sectionLabel = enroll
    ? enroll.section.poligrado
      ? enroll.section.name
      : `${enroll.section.grade?.name ?? ""} "${enroll.section.name}"`
    : "—"
  const levelLabel =
    enroll?.section.level?.name ??
    enroll?.section.grade?.level?.name ??
    ""

  return NextResponse.json({
    parentName: parent.name,
    child: {
      studentId: s.id,
      studentName: `${s.firstName} ${s.lastName}`,
      level: levelLabel,
      section: sectionLabel,
      grades: grades.map(g => ({
        course: g.competencia.area.name,
        competencia: g.competencia.name,
        period: g.period.name,
        score: g.finalScore,
        level: g.level,
        display: g.finalScore != null ? `${g.finalScore} (${g.level})` : (g.level || "—"),
      })),
      attendance: { present, late, absent, total: att.length },
      attendanceDaily: att.slice(0, 15).map(a => ({
        date: a.date,
        status: a.status,
        entryAt: a.entryAt,
        exitAt: a.exitAt,
      })),
      conducta: incidents.map(i => ({
        id: i.id,
        type: i.type,
        title: i.title,
        description: i.description,
        severity: i.severity,
        date: i.date,
      })),
      payments: orders.map(o => ({
        month: o.month,
        year: o.year,
        amount: o.amount,
        status: o.status,
        paid: o.payments.reduce((acc, p) => acc + p.amount, 0),
      })),
    },
  })
}
