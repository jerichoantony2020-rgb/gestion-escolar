import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const SLUG = "cristo-reina"

export async function GET() {
  const inst = await prisma.institution.findUnique({ where: { slug: SLUG } })
  if (!inst) return NextResponse.json([])
  const items = await prisma.noticia.findMany({
    where: { institutionId: inst.id, published: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { title, content, imageUrl, published } = await req.json()
  if (!title?.trim() || !content?.trim())
    return NextResponse.json({ error: "Título y contenido requeridos" }, { status: 400 })
  const item = await prisma.noticia.create({
    data: { institutionId: session.user.institutionId, title, content, imageUrl: imageUrl || null, published: !!published },
  })
  return NextResponse.json(item, { status: 201 })
}
