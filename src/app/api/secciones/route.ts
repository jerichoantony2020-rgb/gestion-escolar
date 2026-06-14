import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/secciones → secciones del usuario (docente: solo asignadas; otros: todas)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const instId = session.user.institutionId
  const year = await prisma.institutionYear.findFirst({ where: { institutionId: instId, active: true } })

  if (session.user.role === "docente") {
    const staff = await prisma.staff.findFirst({ where: { userId: session.user.id } })
    if (staff) {
      const assignments = await prisma.courseAssignment.findMany({
        where: { staffId: staff.id, yearId: year?.id },
        include: { section: { include: { grade: true } } },
      })
      const map = new Map<string, { id: string; name: string }>()
      for (const a of assignments) map.set(a.section.id, { id: a.section.id, name: `${a.section.grade.name} "${a.section.name}"` })
      return NextResponse.json([...map.values()])
    }
    return NextResponse.json([])
  }

  const sections = await prisma.section.findMany({
    where: { institutionId: instId },
    include: { grade: true },
    orderBy: { grade: { order: "asc" } },
  })
  return NextResponse.json(sections.map(s => ({ id: s.id, name: `${s.grade.name} "${s.name}"` })))
}
