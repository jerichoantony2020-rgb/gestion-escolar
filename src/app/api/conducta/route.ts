import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/conducta?studentId=&sectionId= → incidencias
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const instId = session.user.institutionId
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")
  const sectionId = searchParams.get("sectionId")

  let studentIds: string[] | undefined
  if (sectionId) {
    const enr = await prisma.studentEnrollment.findMany({ where: { institutionId: instId, sectionId, active: true }, select: { studentId: true } })
    studentIds = enr.map(e => e.studentId)
  }

  const incidents = await prisma.incident.findMany({
    where: {
      institutionId: instId,
      ...(studentId ? { studentId } : {}),
      ...(studentIds ? { studentId: { in: studentIds } } : {}),
    },
    include: { student: true },
    orderBy: { date: "desc" },
  })

  return NextResponse.json(incidents.map(i => ({
    id: i.id,
    studentId: i.studentId,
    studentName: `${i.student.lastName}, ${i.student.firstName}`,
    type: i.type, title: i.title, description: i.description, severity: i.severity,
    date: i.date,
  })))
}

// POST /api/conducta  body {studentId, type, title, description, severity}
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const b = await req.json()
  const incident = await prisma.incident.create({
    data: {
      institutionId: session.user.institutionId,
      studentId: b.studentId,
      type: b.type === "positive" ? "positive" : "negative",
      title: b.title || null,
      description: b.description,
      severity: b.severity || "low",
      date: b.date ? new Date(b.date) : new Date(),
      reportedBy: session.user.name ?? null,
    },
  })
  return NextResponse.json(incident, { status: 201 })
}
