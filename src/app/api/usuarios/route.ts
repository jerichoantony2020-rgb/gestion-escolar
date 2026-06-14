import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const users = await prisma.user.findMany({
    where: { institutionId: session.user.institutionId },
    include: { roles: { include: { role: true } } },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    active: u.active,
    canViewPayments: u.canViewPayments,
    role: u.roles[0]?.role?.name ?? "docente",
  })))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { name, email, password, role, canViewPayments } = body

  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      institutionId: session.user.institutionId,
      name,
      email,
      passwordHash: hash,
      canViewPayments: canViewPayments ?? false,
      active: true,
    },
  })

  const roleRecord = await prisma.role.findUnique({ where: { name: role ?? "docente" } })
  if (roleRecord) {
    await prisma.userRole.create({
      data: { userId: user.id, roleId: roleRecord.id, institutionId: session.user.institutionId },
    })
  }

  return NextResponse.json({ id: user.id, name: user.name, email: user.email, role }, { status: 201 })
}
