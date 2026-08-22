import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED = ["director", "coordinador", "psicologo"]
const CAN_VIEW_REPORTS = ["director", "coordinador", "psicologo", "docente"]

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.institutionId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const role = session.user.role ?? ""
  if (!CAN_VIEW_REPORTS.includes(role)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const { id } = await params

  const c = await prisma.psychologicalCase.findFirst({
    where: { id, institutionId: session.user.institutionId },
    include: {
      student: {
        include: {
          parents: true,
          enrollments: {
            where: { active: true },
            include: { section: true, grade: true },
            take: 1,
          },
          gradeRecords: {
            include: { course: true, period: true },
            orderBy: { period: { number: "asc" } },
          },
          incidents: { orderBy: { date: "desc" }, take: 10 },
          // Condiciones como asma, TEA o alergias a medicamentos son contexto
          // clínico relevante para el seguimiento psicológico.
          healthRecord: { select: { bloodType: true, allergies: true, conditions: true, medications: true } },
        },
      },
      sessions: { orderBy: { date: "desc" } },
      plan: true,
      contacts: { orderBy: { contactedAt: "desc" } },
      reports: {
        include: { uploadedBy: { select: { name: true } } },
        orderBy: { uploadedAt: "desc" },
      },
      openedBy: { select: { name: true } },
    },
  })

  if (!c) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })

  // Docentes solo ven informes y datos básicos, no sesiones ni plan ni contactos
  if (role === "docente") {
    return NextResponse.json({
      id: c.id,
      status: c.status,
      mainReason: c.mainReason,
      openedAt: c.openedAt,
      student: c.student,
      reports: c.reports,
    })
  }

  return NextResponse.json(c)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.institutionId) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!ALLOWED.includes(session.user.role ?? "")) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const updated = await prisma.psychologicalCase.updateMany({
    where: { id, institutionId: session.user.institutionId },
    data: {
      ...(body.status !== undefined && { status: body.status, closedAt: body.status === "cerrado" ? new Date() : null }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.mainReason !== undefined && { mainReason: body.mainReason }),
    },
  })

  if (updated.count === 0) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
