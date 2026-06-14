import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/cursos → cursos con su nivel y escala
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const courses = await prisma.course.findMany({
    where: { institutionId: session.user.institutionId, active: true },
    include: { level: true },
    orderBy: [{ level: { order: "asc" } }, { name: "asc" }],
  })
  return NextResponse.json(courses.map(c => ({
    id: c.id, name: c.name, code: c.code,
    gradeType: c.gradeType, levelId: c.levelId, levelName: c.level?.name ?? "General",
  })))
}

// POST /api/cursos  body {name, code, levelId, gradeType}
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const b = await req.json()
  const course = await prisma.course.create({
    data: {
      institutionId: session.user.institutionId,
      name: b.name, code: b.code || null,
      levelId: b.levelId || null,
      gradeType: b.gradeType === "qualitative" ? "qualitative" : "quantitative",
      active: true,
    },
  })
  return NextResponse.json(course, { status: 201 })
}
