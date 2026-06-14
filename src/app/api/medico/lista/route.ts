import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/medico/lista → alumnos con estado de ficha, agrupados por aula
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const instId = session.user.institutionId

  const students = await prisma.student.findMany({
    where: { institutionId: instId, active: true },
    include: {
      enrollments: { where: { active: true }, include: { section: { include: { grade: true, level: true } } }, take: 1, orderBy: { id: "desc" } },
      healthRecord: { select: { id: true, bloodType: true, allergies: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  })

  const rows = students.map(s => {
    const enr = s.enrollments[0]
    return {
      id: s.id,
      name: `${s.lastName}, ${s.firstName}`,
      level: enr?.section.level?.name ?? enr?.section.grade?.level?.name ?? "—",
      aula: enr ? (enr.section.poligrado ? enr.section.name : `${enr.section.grade?.name ?? ""} "${enr.section.name}"`) : "Sin aula",
      hasRecord: !!s.healthRecord,
      bloodType: s.healthRecord?.bloodType ?? null,
      hasAllergy: !!(s.healthRecord?.allergies && s.healthRecord.allergies.toLowerCase() !== "ninguna conocida" && s.healthRecord.allergies.toLowerCase() !== "ninguna"),
    }
  })

  return NextResponse.json(rows)
}
