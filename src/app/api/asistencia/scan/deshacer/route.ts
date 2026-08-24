import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { inicioDelDiaPeru } from "@/lib/fecha"

/**
 * POST /api/asistencia/scan/deshacer  body {studentId, date?}
 * Borra el registro de asistencia del día. Existe porque escanear al alumno
 * equivocado pasa, y sin esto no había forma de revertirlo.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!["director", "coordinador", "admin", "docente"].includes(session.user.role ?? "")) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const { studentId, date } = await req.json()
  if (!studentId) return NextResponse.json({ error: "Falta el alumno" }, { status: 400 })

  const day = date ? new Date(date + "T00:00:00.000Z") : inicioDelDiaPeru()

  const { count } = await prisma.attendanceRecord.deleteMany({
    where: { institutionId: session.user.institutionId, studentId, date: day },
  })

  return NextResponse.json({ ok: true, borrados: count })
}
