import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/asistencia?sectionId=&date=YYYY-MM-DD → alumnos + estado del día
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sectionId = searchParams.get("sectionId")
  const dateStr = searchParams.get("date")
  if (!sectionId || !dateStr) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })

  const instId = session.user.institutionId
  const date = new Date(dateStr + "T00:00:00")

  const enrollments = await prisma.studentEnrollment.findMany({
    where: { institutionId: instId, sectionId, active: true },
    include: { student: true },
  })
  const students = enrollments.map(e => e.student)
    .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))

  const records = await prisma.attendanceRecord.findMany({
    where: { institutionId: instId, sectionId, date },
  })
  const byStudent = new Map(records.map(r => [r.studentId, r]))

  const rows = students.map(s => ({
    studentId: s.id,
    studentName: `${s.lastName}, ${s.firstName}`,
    status: byStudent.get(s.id)?.status ?? "present",
    scannedAt: byStudent.get(s.id)?.scannedAt ?? null,
  }))

  return NextResponse.json({ date: dateStr, rows })
}

// POST /api/asistencia  body {sectionId, date, records:[{studentId, status}]}
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const instId = session.user.institutionId
  const { sectionId, date: dateStr, records } = await req.json()
  const date = new Date(dateStr + "T00:00:00")

  for (const r of records) {
    // note lleva la justificación. Solo se toca cuando viene en el payload,
    // para no borrar una justificación existente al reguardar la lista.
    const note = "note" in r ? { note: (r.note ?? "").trim() || null } : {}
    await prisma.attendanceRecord.upsert({
      where: { studentId_sectionId_date: { studentId: r.studentId, sectionId, date } },
      update: { status: r.status, ...note },
      create: { institutionId: instId, studentId: r.studentId, sectionId, date, status: r.status, ...note },
    })
  }

  return NextResponse.json({ ok: true, saved: records.length })
}
