import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { inicioDelDiaPeru, estadoDeIngreso } from "@/lib/fecha"

/**
 * POST /api/asistencia/marcar  body {studentId, status?}
 * Marca a UN alumno en el momento, sin pasar por la lista del aula. Es el
 * camino manual del celular: buscar por nombre y marcar.
 *
 * Sin `status` se decide por la hora (puntual hasta las 8:50, luego tardanza)
 * y se guarda la hora exacta del ingreso. Con `status: "absent"` se registra
 * la falta sin hora, porque no llegó.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { studentId, status: pedido } = await req.json()
  if (!studentId) return NextResponse.json({ error: "Falta el alumno" }, { status: 400 })

  const instId = session.user.institutionId
  const student = await prisma.student.findFirst({
    where: { id: studentId, institutionId: instId },
    include: {
      enrollments: {
        where: { active: true }, take: 1, orderBy: { id: "desc" },
        include: { section: { include: { grade: true } } },
      },
    },
  })
  if (!student) return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 })

  const enroll = student.enrollments[0]
  if (!enroll) return NextResponse.json({ error: "El alumno no tiene aula asignada" }, { status: 400 })

  const now = new Date()
  const day = inicioDelDiaPeru(now)
  const status = pedido ?? estadoDeIngreso(now)
  const llego = status !== "absent"

  const record = await prisma.attendanceRecord.upsert({
    where: { studentId_sectionId_date: { studentId, sectionId: enroll.sectionId, date: day } },
    update: { status, ...(llego ? { entryAt: now } : { entryAt: null }) },
    create: { institutionId: instId, studentId, sectionId: enroll.sectionId, date: day, status, ...(llego ? { entryAt: now } : {}) },
  })

  const sec = enroll.section
  return NextResponse.json({
    ok: true,
    studentId,
    studentName: `${student.lastName}, ${student.firstName}`,
    aula: sec.poligrado ? sec.name : `${sec.grade?.name ?? ""} "${sec.name}"`,
    status: record.status,
    time: llego ? now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", timeZone: "America/Lima" }) : null,
  })
}
