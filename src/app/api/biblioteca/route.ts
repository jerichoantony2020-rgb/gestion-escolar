import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/biblioteca → catálogo de recursos
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const items = await prisma.libraryResource.findMany({
    where: { institutionId: session.user.institutionId, active: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(items)
}

// POST /api/biblioteca → nuevo recurso
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const b = await req.json()
  const item = await prisma.libraryResource.create({
    data: {
      institutionId: session.user.institutionId,
      title: b.title, author: b.author || null, genre: b.genre || null,
      level: b.level || null, grade: b.grade || null, externalUrl: b.externalUrl || null,
      approved: !!b.approved, active: true,
    },
  })
  return NextResponse.json(item, { status: 201 })
}
