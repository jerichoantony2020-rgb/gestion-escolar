import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  const { title, description, imageUrl, category, date, published } = await req.json()
  const item = await prisma.actividad.update({
    where: { id },
    data: {
      title,
      description: description || null,
      imageUrl: imageUrl || null,
      category: category || "academica",
      date: date ? new Date(date) : null,
      published: !!published,
    },
  })
  return NextResponse.json(item)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  await prisma.actividad.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
