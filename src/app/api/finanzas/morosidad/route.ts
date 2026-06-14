import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

// GET /api/finanzas/morosidad → alumnos con deuda acumulada (órdenes vencidas no pagadas)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.canViewPayments) return NextResponse.json({ error: "Sin acceso" }, { status: 403 })
  const instId = session.user.institutionId

  const now = new Date()
  const curY = now.getFullYear(), curM = now.getMonth() + 1

  const orders = await prisma.paymentOrder.findMany({
    where: { institutionId: instId, status: { not: "paid" } },
    include: { payments: true, student: { include: { parents: { take: 1, orderBy: { id: "desc" } } } } },
  })

  // solo órdenes vencidas (mes anterior al actual)
  const vencidas = orders.filter(o => o.year != null && o.month != null && (o.year < curY || (o.year === curY && o.month < curM)))

  const byStudent = new Map<string, { studentId: string; studentName: string; phone: string | null; debt: number; months: string[] }>()
  for (const o of vencidas) {
    const paid = o.payments.reduce((s, p) => s + p.amount, 0)
    const pend = o.amount - paid
    if (pend <= 0) continue
    const key = o.studentId
    const existing = byStudent.get(key) ?? {
      studentId: o.studentId,
      studentName: `${o.student.lastName}, ${o.student.firstName}`,
      phone: o.student.parents[0]?.phone ?? null,
      debt: 0, months: [],
    }
    existing.debt += pend
    existing.months.push(`${MESES[(o.month ?? 1) - 1]} ${o.year}`)
    byStudent.set(key, existing)
  }

  const rows = [...byStudent.values()].sort((a, b) => b.debt - a.debt)
  const totalDebt = rows.reduce((s, r) => s + r.debt, 0)

  return NextResponse.json({ rows, totalDebt, count: rows.length })
}
