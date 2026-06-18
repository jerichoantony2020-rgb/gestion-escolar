import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED = ["director", "coordinador", "psicologo"]

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.institutionId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!ALLOWED.includes(session.user.role ?? "")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const { id } = await params
  const { action, mainReason } = await req.json() // action: "aceptar" | "rechazar"

  const derivation = await prisma.psychologicalDerivation.findFirst({
    where: { id, institutionId: session.user.institutionId },
  })
  if (!derivation) return NextResponse.json({ error: "No encontrada" }, { status: 404 })
  if (derivation.status !== "pendiente") return NextResponse.json({ error: "Ya fue procesada" }, { status: 400 })

  if (action === "rechazar") {
    await prisma.psychologicalDerivation.update({
      where: { id },
      data: { status: "rechazada", respondedAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  }

  if (action === "aceptar") {
    const reason = mainReason ?? derivation.reason
    const newCase = await prisma.psychologicalCase.create({
      data: {
        institutionId: session.user.institutionId,
        studentId: derivation.studentId,
        openedById: session.user.id,
        mainReason: reason,
        referralSource: "docente",
      },
    })
    await prisma.psychologicalDerivation.update({
      where: { id },
      data: { status: "aceptada", respondedAt: new Date(), caseId: newCase.id },
    })
    return NextResponse.json({ ok: true, caseId: newCase.id })
  }

  return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
}
