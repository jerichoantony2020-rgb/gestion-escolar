import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const CAN_MANAGE = new Set(["director", "coordinador", "admin"])

// GET /api/admin/competencias → todas las áreas/competencias agrupadas por nivel,
// con el curso al que está enlazada cada competencia (quién la califica) y las
// opciones de curso disponibles por nivel, para poder corregir el mapeo.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!CAN_MANAGE.has(session.user.role)) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  const instId = session.user.institutionId

  const levels = await prisma.level.findMany({ where: { institutionId: instId }, orderBy: { order: "asc" } })
  const areas = await prisma.area.findMany({
    where: { institutionId: instId },
    include: { competencias: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  })
  const courses = await prisma.course.findMany({ where: { institutionId: instId, active: true }, orderBy: { name: "asc" } })

  return NextResponse.json({
    levels: levels.map(l => ({
      id: l.id,
      name: l.name,
      courses: courses.filter(c => c.levelId === l.id).map(c => ({ id: c.id, name: c.name })),
      areas: areas.filter(a => a.levelId === l.id).map(a => ({
        id: a.id,
        name: a.name,
        competencias: a.competencias.map(c => ({ id: c.id, name: c.name, courseId: c.courseId })),
      })),
    })),
  })
}

// POST { updates: [{ competenciaId, courseId }] } → reasigna a qué curso pertenece cada competencia.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!CAN_MANAGE.has(session.user.role)) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const { updates } = await req.json() as { updates: { competenciaId: string; courseId: string | null }[] }
  if (!Array.isArray(updates)) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  for (const u of updates) {
    await prisma.competencia.update({ where: { id: u.competenciaId }, data: { courseId: u.courseId || null } })
  }

  return NextResponse.json({ ok: true })
}

// DELETE { competenciaId } → quita una competencia del área (ej. una que no es oficial del MINEDU).
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!CAN_MANAGE.has(session.user.role)) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  const { competenciaId } = await req.json()
  if (!competenciaId) return NextResponse.json({ error: "Falta competenciaId" }, { status: 400 })

  await prisma.competencia.delete({ where: { id: competenciaId } })
  return NextResponse.json({ ok: true })
}
