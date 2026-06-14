import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/finanzas/pago  body {orderId, amount, method, note}  → registra pago
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.canViewPayments) return NextResponse.json({ error: "Sin acceso" }, { status: 403 })

  const instId = session.user.institutionId
  const { orderId, amount, method, note } = await req.json()

  const order = await prisma.paymentOrder.findFirst({
    where: { id: orderId, institutionId: instId },
    include: { payments: true },
  })
  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 })

  await prisma.payment.create({
    data: {
      institutionId: instId,
      orderId,
      amount: parseFloat(amount),
      method: method ?? "cash",
      note: note ?? null,
    },
  })

  const paidTotal = order.payments.reduce((s, p) => s + p.amount, 0) + parseFloat(amount)
  const newStatus = paidTotal >= order.amount ? "paid" : "partial"
  await prisma.paymentOrder.update({ where: { id: orderId }, data: { status: newStatus } })

  return NextResponse.json({ ok: true, status: newStatus, paidTotal })
}
