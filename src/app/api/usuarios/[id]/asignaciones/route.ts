import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Crea (si no existe) el registro de personal ligado a este usuario — hace
// falta para poder asignarle aulas/cursos, y hasta ahora nada lo creaba.
async function ensureStaff(institutionId: string, userId: string) {
  let staff = await prisma.staff.findUnique({ where: { userId } })
  if (!staff) {
    staff = await prisma.staff.create({ data: { institutionId, userId, staffType: "docente", active: true } })
  }
  return staff
}

// GET /api/usuarios/:id/asignaciones → aulas y cursos asignados a este usuario
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  const instId = session.user.institutionId

  const staff = await ensureStaff(instId, id)
  const year = await prisma.institutionYear.findFirst({ where: { institutionId: instId, active: true } })

  const assignments = await prisma.courseAssignment.findMany({
    where: { institutionId: instId, staffId: staff.id, ...(year ? { yearId: year.id } : {}) },
    include: { section: { include: { grade: true } }, course: true },
    orderBy: [{ section: { name: "asc" } }, { course: { name: "asc" } }],
  })

  return NextResponse.json(assignments.map(a => ({
    id: a.id,
    sectionId: a.sectionId,
    sectionName: a.section.poligrado ? a.section.name : `${a.section.grade?.name ?? ""} "${a.section.name}"`,
    courseId: a.courseId,
    courseName: a.course.name,
  })))
}

// POST /api/usuarios/:id/asignaciones  body {sectionId, courseId}
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  const instId = session.user.institutionId
  const { sectionId, courseId } = await req.json()
  if (!sectionId || !courseId) return NextResponse.json({ error: "Falta aula o curso" }, { status: 400 })

  const staff = await ensureStaff(instId, id)
  const year = await prisma.institutionYear.findFirst({ where: { institutionId: instId, active: true } })
  if (!year) return NextResponse.json({ error: "No hay un año escolar activo" }, { status: 400 })

  const assignment = await prisma.courseAssignment.upsert({
    where: { staffId_sectionId_courseId_yearId: { staffId: staff.id, sectionId, courseId, yearId: year.id } },
    update: {},
    create: { institutionId: instId, staffId: staff.id, sectionId, courseId, yearId: year.id },
  })
  return NextResponse.json(assignment, { status: 201 })
}
