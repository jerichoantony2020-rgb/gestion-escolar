import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const students = await prisma.student.findMany({
    where: { institutionId: session.user.institutionId, active: true },
    include: {
      enrollments: {
        where: { active: true },
        include: { section: { include: { grade: { include: { level: true } } } } },
        take: 1,
        orderBy: { id: "desc" },
      },
      parents: { take: 1, orderBy: { id: "desc" } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  })

  return NextResponse.json(students)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const { firstName, lastName, dni, birthDate, gender, sectionId,
          guardianName, guardianPhone, monthlyFee } = body

  const student = await prisma.student.create({
    data: {
      institutionId: session.user.institutionId,
      firstName,
      lastName,
      dni: dni || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      gender: gender || null,
      active: true,
    },
  })

  if (sectionId) {
    const year = await prisma.institutionYear.findFirst({
      where: { institutionId: session.user.institutionId, active: true },
    })
    if (year) {
      await prisma.studentEnrollment.create({
        data: {
          institutionId: session.user.institutionId,
          studentId: student.id,
          sectionId,
          yearId: year.id,
          active: true,
        },
      })
    }
  }

  if (guardianName || guardianPhone || monthlyFee) {
    await prisma.studentParent.create({
      data: {
        institutionId: session.user.institutionId,
        studentId: student.id,
        name: guardianName || "",
        phone: guardianPhone || null,
        monthlyFee: monthlyFee ? parseFloat(monthlyFee) : null,
        relationship: "apoderado",
      },
    })
  }

  return NextResponse.json(student, { status: 201 })
}
