import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { firstName, lastName, dni, birthDate, gender, sectionId, guardianName, guardianPhone, monthlyFee } = body

  const student = await prisma.student.update({
    where: { id },
    data: {
      firstName,
      lastName,
      dni: dni || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      gender: gender || null,
    },
  })

  if (sectionId !== undefined) {
    const year = await prisma.institutionYear.findFirst({
      where: { institutionId: session.user.institutionId, active: true },
    })
    if (year) {
      const existing = await prisma.studentEnrollment.findUnique({
        where: { studentId_yearId: { studentId: id, yearId: year.id } },
      })
      if (sectionId) {
        if (existing) {
          await prisma.studentEnrollment.update({ where: { id: existing.id }, data: { sectionId, active: true } })
        } else {
          await prisma.studentEnrollment.create({
            data: { institutionId: session.user.institutionId, studentId: id, sectionId, yearId: year.id, active: true },
          })
        }
      } else if (existing) {
        await prisma.studentEnrollment.update({ where: { id: existing.id }, data: { active: false } })
      }
    }
  }

  if (guardianName !== undefined || guardianPhone !== undefined || monthlyFee !== undefined) {
    const fee = monthlyFee !== undefined && monthlyFee !== "" ? parseFloat(monthlyFee) : null
    const existing = await prisma.studentParent.findFirst({ where: { studentId: id } })
    if (existing) {
      await prisma.studentParent.update({
        where: { id: existing.id },
        data: { name: guardianName || "", phone: guardianPhone || null, monthlyFee: fee },
      })
    } else if (guardianName || monthlyFee) {
      await prisma.studentParent.create({
        data: {
          institutionId: session.user.institutionId,
          studentId: id,
          name: guardianName || "",
          phone: guardianPhone || null,
          monthlyFee: fee,
          relationship: "apoderado",
        },
      })
    }
  }

  return NextResponse.json(student)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params
  await prisma.student.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
