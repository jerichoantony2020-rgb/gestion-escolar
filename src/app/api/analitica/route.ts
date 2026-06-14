import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/analitica → tarjetas de resumen institucional
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const instId = session.user.institutionId
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [totalStudents, totalStaff, sections] = await Promise.all([
    prisma.student.count({ where: { institutionId: instId, active: true } }),
    prisma.staff.count({ where: { institutionId: instId, active: true } }),
    prisma.section.count({ where: { institutionId: instId } }),
  ])

  // Asistencia del mes
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 1)
  const attendance = await prisma.attendanceRecord.findMany({
    where: { institutionId: instId, date: { gte: monthStart, lt: monthEnd } },
    select: { status: true },
  })
  const present = attendance.filter(a => a.status === "present").length
  const late = attendance.filter(a => a.status === "late").length
  const attendancePct = attendance.length ? Math.round(((present + late) / attendance.length) * 100) : null

  // Finanzas del mes
  const orders = await prisma.paymentOrder.findMany({
    where: { institutionId: instId, year, month },
    include: { payments: true },
  })
  const recaudado = orders.reduce((s, o) => s + o.payments.reduce((p, x) => p + x.amount, 0), 0)
  const totalEsperado = orders.reduce((s, o) => s + o.amount, 0)
  const pagados = orders.filter(o => o.status === "paid").length
  const morosos = orders.filter(o => o.status !== "paid").length
  const morosidadPct = orders.length ? Math.round((morosos / orders.length) * 100) : null

  // Alumnos por grado
  const enrollments = await prisma.studentEnrollment.findMany({
    where: { institutionId: instId, active: true },
    include: { section: { include: { grade: true } } },
  })
  const porGrado: Record<string, number> = {}
  for (const e of enrollments) {
    const g = e.section.grade.name
    porGrado[g] = (porGrado[g] ?? 0) + 1
  }

  return NextResponse.json({
    totalStudents, totalStaff, sections,
    attendancePct, attendanceRecords: attendance.length,
    recaudado, totalEsperado, pagados, morosos, morosidadPct, ordersCount: orders.length,
    porGrado,
    month, year,
  })
}
