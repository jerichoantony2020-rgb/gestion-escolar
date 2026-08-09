import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generatePortalCode } from "@/lib/portalRateLimit"

type ImportRow = {
  firstName?: string
  lastName?: string
  dni?: string
  gradeName?: string
  sectionName?: string
  guardianName?: string
  guardianPhone?: string
  monthlyFee?: string | number
}

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[°"']/g, "").replace(/\s+/g, " ").trim()
}

// POST /api/alumnos/importar  body { rows: ImportRow[] }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const instId = session.user.institutionId
  const { rows } = (await req.json()) as { rows: ImportRow[] }
  if (!Array.isArray(rows)) return NextResponse.json({ error: "Formato inválido" }, { status: 400 })

  const year = await prisma.institutionYear.findFirst({ where: { institutionId: instId, active: true } })

  // Mapa de secciones por "grado seccion" — incluye todos los grados de aulas polígrado
  const sections = await prisma.section.findMany({
    where: { institutionId: instId },
    include: { sectionGrades: { include: { grade: true } } },
  })
  const sectionMap = new Map<string, string>()
  for (const s of sections) {
    for (const sg of s.sectionGrades) {
      sectionMap.set(`${norm(sg.grade.name)}|${norm(s.name)}`, s.id)
    }
  }

  const errors: string[] = []
  let created = 0

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    const firstName = String(r.firstName ?? "").trim()
    const lastName = String(r.lastName ?? "").trim()
    if (!firstName || !lastName) {
      errors.push(`Fila ${i + 2}: faltan nombres o apellidos`)
      continue
    }

    let sectionId: string | undefined
    if (r.gradeName && r.sectionName) {
      sectionId = sectionMap.get(`${norm(String(r.gradeName))}|${norm(String(r.sectionName))}`)
      if (!sectionId) errors.push(`Fila ${i + 2}: sección "${r.gradeName} ${r.sectionName}" no encontrada`)
    }

    try {
      const student = await prisma.student.create({
        data: { institutionId: instId, firstName, lastName, dni: r.dni ? String(r.dni).trim() : null, active: true },
      })

      if (sectionId && year) {
        await prisma.studentEnrollment.create({
          data: { institutionId: instId, studentId: student.id, sectionId, yearId: year.id, active: true },
        })
      }

      const fee = r.monthlyFee !== undefined && r.monthlyFee !== "" ? parseFloat(String(r.monthlyFee)) : null
      if (r.guardianName || r.guardianPhone || fee != null) {
        let portalCode = generatePortalCode()
        // Ensure uniqueness (collision probability is negligible but guard anyway)
        while (await prisma.studentParent.findUnique({ where: { portalCode } })) {
          portalCode = generatePortalCode()
        }
        await prisma.studentParent.create({
          data: {
            institutionId: instId, studentId: student.id,
            name: r.guardianName ? String(r.guardianName).trim() : "",
            phone: r.guardianPhone ? String(r.guardianPhone).trim() : null,
            monthlyFee: fee, relationship: "apoderado",
            portalCode,
          },
        })
      }

      await prisma.studentQrCode.create({
        data: { institutionId: instId, studentId: student.id, qrData: `CR-${student.id}`, active: true },
      })

      created++
    } catch (e) {
      errors.push(`Fila ${i + 2}: error al crear (${(e as Error).message})`)
    }
  }

  return NextResponse.json({ created, errors })
}
