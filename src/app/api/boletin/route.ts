import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/boletin?studentId=&periodId= → notas de todos los cursos del alumno en ese bimestre
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")
  const periodId = searchParams.get("periodId")
  if (!studentId || !periodId) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })

  const instId = session.user.institutionId

  const student = await prisma.student.findFirst({
    where: { id: studentId, institutionId: instId },
    include: {
      enrollments: { where: { active: true }, include: { section: { include: { grade: true } } }, take: 1, orderBy: { id: "desc" } },
    },
  })
  if (!student) return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 })

  const records = await prisma.gradeRecord.findMany({
    where: { institutionId: instId, studentId, periodId },
    include: { course: true },
  })

  const period = await prisma.academicPeriod.findUnique({ where: { id: periodId } })

  const enroll = student.enrollments[0]
  return NextResponse.json({
    studentName: `${student.lastName}, ${student.firstName}`,
    section: enroll ? `${enroll.section.grade.name} "${enroll.section.name}"` : "—",
    period: period?.name ?? "",
    courses: records
      .map(r => ({
        courseName: r.course.name,
        gradeType: r.course.gradeType,
        finalGrade: r.finalGrade,
        qualitative: r.qualitative,
        display: r.course.gradeType === "qualitative" ? (r.qualitative ?? "—") : (r.finalGrade != null ? r.finalGrade.toFixed(1) : "—"),
      }))
      .sort((a, b) => a.courseName.localeCompare(b.courseName)),
  })
}
