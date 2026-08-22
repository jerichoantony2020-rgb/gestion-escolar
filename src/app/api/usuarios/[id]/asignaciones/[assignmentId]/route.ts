import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE /api/usuarios/:id/asignaciones/:assignmentId
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; assignmentId: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { assignmentId } = await params

  await prisma.courseAssignment.delete({ where: { id: assignmentId, institutionId: session.user.institutionId } })
  return NextResponse.json({ ok: true })
}
