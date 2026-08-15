import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim()
}

const MARK_STATUS: Record<string, string> = { A: "present", T: "late", F: "absent" }

type BlockStudent = { name: string; marks: (string | null)[] }
type Block = { year: number; month: number; days: number[]; students: BlockStudent[] }

// POST /api/asistencia/importar-plantilla  body {sectionId, blocks: Block[]}
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const instId = session.user.institutionId

  const { sectionId, blocks } = (await req.json()) as { sectionId: string; blocks: Block[] }
  if (!sectionId || !Array.isArray(blocks)) return NextResponse.json({ error: "Formato inválido" }, { status: 400 })

  const enrollments = await prisma.studentEnrollment.findMany({
    where: { institutionId: instId, sectionId, active: true },
    include: { student: true },
  })
  const roster = new Map<string, string>()
  for (const e of enrollments) {
    roster.set(norm(`${e.student.lastName}, ${e.student.firstName}`), e.student.id)
  }

  let written = 0
  const unmatched = new Set<string>()

  for (const block of blocks) {
    for (const st of block.students) {
      const studentId = roster.get(norm(st.name))
      if (!studentId) {
        if (st.name.trim()) unmatched.add(st.name.trim())
        continue
      }
      for (let i = 0; i < block.days.length; i++) {
        const mark = (st.marks[i] ?? "").toString().trim().toUpperCase()
        const status = MARK_STATUS[mark]
        if (!status) continue
        const date = new Date(block.year, block.month - 1, block.days[i])
        await prisma.attendanceRecord.upsert({
          where: { studentId_sectionId_date: { studentId, sectionId, date } },
          update: { status },
          create: { institutionId: instId, studentId, sectionId, date, status },
        })
        written++
      }
    }
  }

  return NextResponse.json({ written, unmatched: [...unmatched] })
}
