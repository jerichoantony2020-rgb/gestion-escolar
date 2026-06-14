import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/medico?studentId= → ficha de salud del alumno
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")
  if (!studentId) return NextResponse.json({ error: "Falta studentId" }, { status: 400 })

  const record = await prisma.studentHealthRecord.findUnique({ where: { studentId } })
  return NextResponse.json(record ?? {})
}

// PUT /api/medico  body {studentId, weight, height, bloodType, allergies, medications, conditions, insurance}
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const b = await req.json()
  const data = {
    weight: b.weight ? parseFloat(b.weight) : null,
    height: b.height ? parseFloat(b.height) : null,
    bloodType: b.bloodType || null,
    allergies: b.allergies || null,
    medications: b.medications || null,
    conditions: b.conditions || null,
    insurance: b.insurance || null,
  }

  const record = await prisma.studentHealthRecord.upsert({
    where: { studentId: b.studentId },
    update: data,
    create: { studentId: b.studentId, ...data },
  })
  return NextResponse.json(record)
}
