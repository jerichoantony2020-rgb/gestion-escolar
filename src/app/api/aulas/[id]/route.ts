import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/aulas/:id  body {name, gradeIds:[...]}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  const { name, gradeIds } = await req.json()

  const poligrado = Array.isArray(gradeIds) && gradeIds.length > 1
  await prisma.section.update({
    where: { id },
    data: { name, poligrado, gradeId: gradeIds?.[0] ?? null },
  })
  if (Array.isArray(gradeIds)) {
    await prisma.sectionGrade.deleteMany({ where: { sectionId: id } })
    for (const gid of gradeIds) {
      await prisma.sectionGrade.create({ data: { sectionId: id, gradeId: gid } })
    }
  }
  return NextResponse.json({ ok: true })
}

// DELETE /api/aulas/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params

  const count = await prisma.studentEnrollment.count({ where: { sectionId: id, active: true } })
  if (count > 0) return NextResponse.json({ error: `No se puede eliminar: tiene ${count} alumnos matriculados` }, { status: 400 })

  await prisma.sectionGrade.deleteMany({ where: { sectionId: id } })
  await prisma.section.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
