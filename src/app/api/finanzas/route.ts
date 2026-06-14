import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/finanzas?year=2026&month=6  → estado de pensiones del mes por alumno
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.canViewPayments) return NextResponse.json({ error: "Sin acceso" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get("month") ?? String(new Date().getMonth() + 1))

  const instId = session.user.institutionId

  const students = await prisma.student.findMany({
    where: { institutionId: instId, active: true },
    include: {
      enrollments: {
        where: { active: true },
        include: { section: { include: { grade: true } } },
        take: 1, orderBy: { id: "desc" },
      },
      parents: { take: 1, orderBy: { id: "desc" } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  })

  const orders = await prisma.paymentOrder.findMany({
    where: { institutionId: instId, year, month },
    include: { payments: true },
  })
  const orderByStudent = new Map(orders.map(o => [o.studentId, o]))

  const defaultFeeCfg = await prisma.institutionConfig.findUnique({
    where: { institutionId_key: { institutionId: instId, key: "defaultMonthlyFee" } },
  })
  const defaultFee = defaultFeeCfg ? parseFloat(defaultFeeCfg.value) : 0

  const rows = students.map(s => {
    const enroll = s.enrollments[0]
    const parent = s.parents[0]
    const order = orderByStudent.get(s.id)
    const paidTotal = order ? order.payments.reduce((sum, p) => sum + p.amount, 0) : 0
    return {
      studentId: s.id,
      studentName: `${s.lastName}, ${s.firstName}`,
      section: enroll ? `${enroll.section.grade.name} "${enroll.section.name}"` : "—",
      guardianName: parent?.name ?? "",
      guardianPhone: parent?.phone ?? "",
      fee: parent?.monthlyFee ?? defaultFee,
      orderId: order?.id ?? null,
      amount: order?.amount ?? (parent?.monthlyFee ?? defaultFee),
      status: order?.status ?? "sin_generar",
      paidTotal,
    }
  })

  return NextResponse.json({ year, month, rows })
}
