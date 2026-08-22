import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim()
}

type Row = {
  dni?: string | null
  name?: string | null      // "Apellidos, Nombres"
  bloodType?: string | null
  allergies?: string | null
}

// POST /api/medico/importar  body { rows: Row[] }
// Carga tipo de sangre y alergias/condiciones desde el registro de apoderados.
// Sólo escribe los campos enviados: nunca borra datos que la enfermería ya haya
// completado a mano.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!["director", "admin", "coordinador", "enfermera", "superadmin"].includes(session.user.role)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const instId = session.user.institutionId
  const { rows } = (await req.json()) as { rows: Row[] }
  if (!Array.isArray(rows)) return NextResponse.json({ error: "Formato inválido" }, { status: 400 })

  const students = await prisma.student.findMany({
    where: { institutionId: instId, active: true },
    select: { id: true, dni: true, firstName: true, lastName: true },
  })
  const byDni = new Map<string, string>()
  const byName = new Map<string, string>()
  for (const s of students) {
    if (s.dni) byDni.set(s.dni.trim(), s.id)
    byName.set(norm(`${s.lastName}, ${s.firstName}`), s.id)
  }

  let updated = 0
  const unmatched: string[] = []

  for (const r of rows) {
    const dni = r.dni?.trim()
    const studentId = (dni && byDni.get(dni)) || (r.name && byName.get(norm(r.name))) || null
    if (!studentId) {
      if (r.name) unmatched.push(r.name)
      continue
    }

    const data: { bloodType?: string; allergies?: string } = {}
    if (r.bloodType) data.bloodType = r.bloodType
    if (r.allergies) data.allergies = r.allergies
    if (Object.keys(data).length === 0) continue

    await prisma.studentHealthRecord.upsert({
      where: { studentId },
      update: data,
      create: { studentId, ...data },
    })
    updated++
  }

  return NextResponse.json({ updated, unmatched })
}
