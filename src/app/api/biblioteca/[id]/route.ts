import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  const b = await req.json()
  await prisma.libraryResource.update({
    where: { id },
    data: { title: b.title, author: b.author || null, genre: b.genre || null, level: b.level || null, grade: b.grade || null, externalUrl: b.externalUrl || null, approved: !!b.approved },
  })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  await prisma.libraryResource.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ ok: true })
}
