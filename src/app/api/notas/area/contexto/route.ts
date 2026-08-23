import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/notas/area/contexto → secciones, cursos (con competencias definidas) y bimestres
// que el usuario puede calificar por competencia (formato MINEDU). Incluye "pairs" con las
// combinaciones reales sección+curso, para que el selector de curso solo muestre lo que
// corresponde a la sección elegida (nunca cursos de otro nivel u otra asignación).
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

  const coursesWithComp = await prisma.course.findMany({
    where: { institutionId: instId, competencias: { some: {} } },
    select: { id: true },
  })
  const validCourseIds = new Set(coursesWithComp.map(c => c.id))

  let courses, sections, pairs

  if (esDocente) {
    const staff = await prisma.staff.findFirst({ where: { userId: session.user.id } })
    const assignments = staff
      ? await prisma.courseAssignment.findMany({
          where: { staffId: staff.id, yearId: year?.id, courseId: { in: [...validCourseIds] } },
          include: { course: true, section: true },
        })
      : []
    const courseMap = new Map<string, { id: string; name: string }>()
    const sectionMap = new Map<string, { id: string; name: string }>()
    pairs = assignments.map(a => {
      courseMap.set(a.course.id, { id: a.course.id, name: a.course.name })
      sectionMap.set(a.section.id, { id: a.section.id, name: a.section.name })
      return { sectionId: a.section.id, courseId: a.course.id }
    })
    courses = [...courseMap.values()]
    sections = [...sectionMap.values()]
  } else {
    const cs = await prisma.course.findMany({
      where: { institutionId: instId, active: true, id: { in: [...validCourseIds] } },
      orderBy: { name: "asc" },
    })
    const ss = await prisma.section.findMany({ where: { institutionId: instId }, include: { level: true }, orderBy: [{ level: { order: "asc" } }, { name: "asc" }] })
    courses = cs.map(c => ({ id: c.id, name: c.name, levelId: c.levelId }))
    sections = ss.map(s => ({ id: s.id, name: s.name }))
    // No hay asignación real que consultar (vista de supervisión): cualquier curso del
    // mismo nivel que la sección es un "par" válido para poder revisar cualquier aula.
    pairs = ss.flatMap(s => cs.filter(c => !c.levelId || c.levelId === s.levelId).map(c => ({ sectionId: s.id, courseId: c.id })))
  }

  return NextResponse.json({
    courses,
    sections,
    pairs,
    periods: periods.map(p => ({ id: p.id, name: p.name, number: p.number })),
    role,
  })
}
