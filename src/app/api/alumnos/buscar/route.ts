import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { inicioDelDiaPeru } from "@/lib/fecha"

/**
 * GET /api/alumnos/buscar?q=texto
 * Busca en TODO el colegio, no solo en el aula del docente: cualquiera puede
 * marcar a cualquier alumno, que es como funciona la puerta por la mañana.
 * Devuelve si ya tiene asistencia de hoy para no marcarlo dos veces.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim()
  if (q.length < 2) return NextResponse.json([])

  const instId = session.user.institutionId
  const hoy = inicioDelDiaPeru()

  // Cada palabra debe aparecer en el nombre o el apellido: así "ayala ant"
  // encuentra a "Ayala, Anthony" sin importar el orden en que se escriba.
  const palabras = q.split(/\s+/).slice(0, 4)
  const students = await prisma.student.findMany({
    where: {
      institutionId: instId,
      active: true,
      AND: palabras.map(w => ({
        OR: [
          { firstName: { contains: w, mode: "insensitive" as const } },
          { lastName: { contains: w, mode: "insensitive" as const } },
          { dni: { contains: w } },
        ],
      })),
    },
    take: 25,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    include: {
      enrollments: {
        where: { active: true }, take: 1, orderBy: { id: "desc" },
        include: { section: { include: { grade: { include: { level: true } } } } },
      },
      attendance: { where: { date: hoy }, take: 1 },
    },
  })

  return NextResponse.json(students.map(s => {
    const sec = s.enrollments[0]?.section
    const hoyReg = s.attendance[0]
    return {
      id: s.id,
      name: `${s.lastName}, ${s.firstName}`,
      aula: sec ? (sec.poligrado ? sec.name : `${sec.grade?.name ?? ""} "${sec.name}"`) : "Sin aula",
      nivel: sec?.grade?.level?.name ?? "",
      sectionId: sec?.id ?? null,
      yaMarcado: hoyReg ? hoyReg.status : null,
      horaMarcado: hoyReg?.entryAt ? hoyReg.entryAt.toISOString() : null,
    }
  }))
}
