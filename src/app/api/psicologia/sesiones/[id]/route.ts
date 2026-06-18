import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED = ["director", "coordinador", "psicologo"]

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.institutionId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!ALLOWED.includes(session.user.role ?? "")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const { id } = await params

  // Verify session belongs to a case in this institution
  const s = await prisma.psychologicalSession.findFirst({
    where: { id },
    include: { case: { select: { institutionId: true } } },
  })
  if (!s || s.case.institutionId !== session.user.institutionId)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  await prisma.psychologicalSession.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
