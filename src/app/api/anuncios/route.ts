import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const items = await prisma.announcement.findMany({
    where: { institutionId: session.user.institutionId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { title, content } = await req.json()
  const item = await prisma.announcement.create({
    data: { institutionId: session.user.institutionId, title, content, published: true },
  })
  return NextResponse.json(item, { status: 201 })
}
