import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const LETTERS = ["C", "B", "A", "AD"] // índice 0..3 → puntos 1..4
function letterToPoints(l: string): number { return LETTERS.indexOf(l) + 1 }
function pointsToLetter(p: number): string {
  if (p >= 3.5) return "AD"
  if (p >= 2.5) return "A"
  if (p >= 1.5) return "B"
  return "C"
}

// GET /api/notas?courseId=&sectionId=&periodId= → alumnos + notas existentes
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const courseId = searchParams.get("courseId")
  const sectionId = searchParams.get("sectionId")
  const periodId = searchParams.get("periodId")
  if (!courseId || !sectionId || !periodId) return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 })

  const instId = session.user.institutionId
  const course = await prisma.course.findFirst({ where: { id: courseId, institutionId: instId } })

  const enrollments = await prisma.studentEnrollment.findMany({
    where: { institutionId: instId, sectionId, active: true },
    include: { student: true },
  })
  const students = enrollments
    .map(e => e.student)
    .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`))

  const records = await prisma.gradeRecord.findMany({
    where: { institutionId: instId, courseId, sectionId, periodId },
  })
  const recByStudent = new Map(records.map(r => [r.studentId, r]))

  const rows = students.map(s => {
    const rec = recByStudent.get(s.id)
    let scores: (number | string)[] = []
    try { scores = rec ? JSON.parse(rec.scores) : [] } catch { scores = [] }
    return {
      studentId: s.id,
      studentName: `${s.lastName}, ${s.firstName}`,
      scores,
      finalGrade: rec?.finalGrade ?? null,
      qualitative: rec?.qualitative ?? null,
      observation: rec?.observation ?? "",
    }
  })

  return NextResponse.json({ gradeType: course?.gradeType ?? "quantitative", rows })
}

// POST /api/notas  body {courseId, sectionId, periodId, gradeType, records:[{studentId, scores, observation}]}
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const instId = session.user.institutionId
  const { courseId, sectionId, periodId, gradeType, records } = await req.json()

  for (const r of records) {
    const raw: (number | string)[] = (r.scores ?? []).filter((v: unknown) => v !== "" && v !== null && v !== undefined)
    let finalGrade: number | null = null
    let qualitative: string | null = null

    if (gradeType === "qualitative") {
      const pts = raw.map(v => letterToPoints(String(v))).filter(p => p > 0)
      if (pts.length) {
        const avg = pts.reduce((a, b) => a + b, 0) / pts.length
        qualitative = pointsToLetter(avg)
        finalGrade = Math.round(avg * 100) / 100
      }
    } else {
      const nums = raw.map(v => parseFloat(String(v))).filter(n => !isNaN(n))
      if (nums.length) {
        finalGrade = Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
      }
    }

    await prisma.gradeRecord.upsert({
      where: { studentId_courseId_periodId: { studentId: r.studentId, courseId, periodId } },
      update: { scores: JSON.stringify(r.scores ?? []), finalGrade, qualitative, observation: r.observation || null, sectionId },
      create: {
        institutionId: instId, studentId: r.studentId, courseId, sectionId, periodId,
        scores: JSON.stringify(r.scores ?? []), finalGrade, qualitative, observation: r.observation || null,
      },
    })
  }

  return NextResponse.json({ ok: true, saved: records.length })
}
