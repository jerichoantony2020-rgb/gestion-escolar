import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/finanzas/generar  body {year, month}  → genera órdenes faltantes del mes
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.canViewPayments) return NextResponse.json({ error: "Sin acceso" }, { status: 403 })

  const instId = session.user.institutionId
  const { year, month } = await req.json()

  // Concepto de pensión
  let concept = await prisma.billingConcept.findFirst({ where: { institutionId: instId, name: "Pensión mensual" } })
  if (!concept) {
    concept = await prisma.billingConcept.create({ data: { institutionId: instId, name: "Pensión mensual", amount: 0, active: true } })
  }

  const defaultFeeCfg = await prisma.institutionConfig.findUnique({
    where: { institutionId_key: { institutionId: instId, key: "defaultMonthlyFee" } },
  })
  const defaultFee = defaultFeeCfg ? parseFloat(defaultFeeCfg.value) : 0

  const students = await prisma.student.findMany({
    where: { institutionId: instId, active: true },
    include: { parents: { take: 1, orderBy: { id: "desc" } } },
  })

  const existing = await prisma.paymentOrder.findMany({
    where: { institutionId: instId, year, month },
    select: { studentId: true },
  })
  const hasOrder = new Set(existing.map(o => o.studentId))

  const dueDate = new Date(year, month, 5) // día 5 del mes siguiente
  let created = 0
  for (const s of students) {
    if (hasOrder.has(s.id)) continue
    const fee = s.parents[0]?.monthlyFee ?? defaultFee
    await prisma.paymentOrder.create({
      data: {
        institutionId: instId,
        studentId: s.id,
        conceptId: concept.id,
        amount: fee,
        dueDate,
        month,
        year,
        status: "pending",
      },
    })
    created++
  }

  return NextResponse.json({ created })
}
