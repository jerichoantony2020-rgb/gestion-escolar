import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/finanzas/orden/:id  body {amount?, status?}  → editar orden
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.canViewPayments) return NextResponse.json({ error: "Sin acceso" }, { status: 403 })

  const { id } = await params
  const { amount, status } = await req.json()
  const data: Record<string, unknown> = {}
  if (amount !== undefined) data.amount = parseFloat(amount)
  if (status !== undefined) data.status = status

  await prisma.paymentOrder.update({ where: { id }, data })
  return NextResponse.json({ ok: true })
}
