import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const configs = await prisma.institutionConfig.findMany({
    where: { institutionId: session.user.institutionId },
  })

  const result: Record<string, string> = {}
  for (const c of configs) result[c.key] = c.value
  return NextResponse.json(result)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  for (const [key, value] of Object.entries(body)) {
    await prisma.institutionConfig.upsert({
      where: { institutionId_key: { institutionId: session.user.institutionId, key } },
      update: { value: String(value) },
      create: { institutionId: session.user.institutionId, key, value: String(value) },
    })
  }

  return NextResponse.json({ ok: true })
}
