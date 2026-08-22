import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/notas/contexto → cursos, secciones y periodos que el usuario puede calificar
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const instId = session.user.institutionId
  const role = session.user.role
  const esDocente = role === "docente"

  const year = await prisma.institutionYear.findFirst({ where: { institutionId: instId, active: true } })
  const periods = year
    ? await prisma.academicPeriod.findMany({ where: { yearId: year.id }, orderBy: { number: "asc" } })
    : []

  let courses, sections

  if (esDocente) {
    const staff = await prisma.staff.findFirst({ where: { userId: session.user.id } })
    const assignments = staff
      ? await prisma.courseAssignment.findMany({
          where: { staffId: staff.id, yearId: year?.id, course: { active: true } },
          include: { course: true, section: { include: { grade: true } } },
        })
      : []
    const courseMap = new Map<string, { id: string; name: string; gradeType: string }>()
    const sectionMap = new Map<string, { id: string; name: string }>()
    for (const a of assignments) {
      courseMap.set(a.course.id, { id: a.course.id, name: a.course.name, gradeType: a.course.gradeType })
      sectionMap.set(a.section.id, { id: a.section.id, name: `${a.section.grade.name} "${a.section.name}"` })
    }
    courses = [...courseMap.values()]
    sections = [...sectionMap.values()]
  } else {
    const cs = await prisma.course.findMany({ where: { institutionId: instId, active: true }, orderBy: { name: "asc" } })
    const ss = await prisma.section.findMany({ where: { institutionId: instId }, include: { grade: true }, orderBy: { grade: { order: "asc" } } })
    courses = cs.map(c => ({ id: c.id, name: c.name, gradeType: c.gradeType }))
    sections = ss.map(s => ({ id: s.id, name: `${s.grade.name} "${s.name}"` }))
  }

  return NextResponse.json({
    courses,
    sections,
    periods: periods.map(p => ({ id: p.id, name: p.name, number: p.number })),
    role,
  })
}
