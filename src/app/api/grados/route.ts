import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const grades = await prisma.grade.findMany({
    where: { institutionId: session.user.institutionId },
    include: { level: true, sections: true },
    orderBy: [{ level: { order: "asc" } }, { order: "asc" }],
  })

  return NextResponse.json(grades)
}
