import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/conducta/codigos → catálogo de faltas del reglamento, agrupado por categoría
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const codes = await prisma.conductCode.findMany({
    where: { institutionId: session.user.institutionId },
    orderBy: [{ category: "asc" }, { order: "asc" }],
  })

  return NextResponse.json(codes)
}
