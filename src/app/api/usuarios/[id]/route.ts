import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { syncStaffForRole } from "@/lib/staff"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, email, password, role, canViewPayments, active } = body

  const data: Record<string, unknown> = { name, email, canViewPayments, active }
  if (password) data.passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.update({ where: { id }, data })

  if (role) {
    const roleRecord = await prisma.role.findUnique({ where: { name: role } })
    if (roleRecord) {
      await prisma.userRole.deleteMany({ where: { userId: id } })
      await prisma.userRole.create({
        data: { userId: id, roleId: roleRecord.id, institutionId: session.user.institutionId },
      })
    }
    await syncStaffForRole(session.user.institutionId, id, role)
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  await prisma.user.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
