import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET /api/apoderados → apoderados con cuenta vinculada
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const links = await prisma.studentParent.findMany({
    where: { institutionId: session.user.institutionId, userId: { not: null } },
    include: { student: true, user: true },
  })
  return NextResponse.json(links.map(l => ({
    id: l.id,
    parentName: l.name,
    email: l.user?.email ?? "",
    studentName: `${l.student.lastName}, ${l.student.firstName}`,
    phone: l.phone,
  })))
}

// POST /api/apoderados  body {studentParentId | studentId, name, email, password, phone}
// Crea cuenta de usuario (rol padre) y la vincula al apoderado/alumno
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const instId = session.user.institutionId
  const { studentId, name, email, password, phone } = await req.json()

  const exists = await prisma.user.findFirst({ where: { institutionId: instId, email } })
  if (exists) return NextResponse.json({ error: "Ya existe un usuario con ese correo" }, { status: 400 })

  const hash = await bcrypt.hash(password, 12)
  const role = await prisma.role.findUnique({ where: { name: "padre" } })
  const existingParent = await prisma.studentParent.findFirst({ where: { studentId, institutionId: instId } })

  const userId = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { institutionId: instId, name, email, passwordHash: hash, canViewPayments: false, active: true },
    })
    if (role) {
      await tx.userRole.create({ data: { userId: user.id, roleId: role.id, institutionId: instId } })
    }
    if (existingParent) {
      await tx.studentParent.update({
        where: { id: existingParent.id },
        data: { userId: user.id, name, phone: phone || existingParent.phone, email },
      })
    } else {
      await tx.studentParent.create({
        data: { institutionId: instId, studentId, userId: user.id, name, phone: phone || null, email, relationship: "apoderado" },
      })
    }
    return user.id
  })

  return NextResponse.json({ ok: true, userId }, { status: 201 })
}
