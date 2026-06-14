import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/asistencia/qr?sectionId= → alumnos + su código QR para imprimir
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sectionId = searchParams.get("sectionId")
  if (!sectionId) return NextResponse.json({ error: "Falta sectionId" }, { status: 400 })

  const instId = session.user.institutionId
  const enrollments = await prisma.studentEnrollment.findMany({
    where: { institutionId: instId, sectionId, active: true },
    include: { student: { include: { qrCodes: { where: { active: true }, take: 1 } } } },
  })

  const rows = enrollments.map(e => ({
    studentId: e.student.id,
    studentName: `${e.student.lastName}, ${e.student.firstName}`,
    qrData: e.student.qrCodes[0]?.qrData ?? `CR-${e.student.id}`,
  })).sort((a, b) => a.studentName.localeCompare(b.studentName))

  return NextResponse.json({ rows })
}
