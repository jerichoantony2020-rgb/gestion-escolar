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
    code: i.code, points: i.points,
    date: i.date,
  })))
}

// POST /api/conducta  body {studentId, type, code?, title, description, severity, date, note?}
// Si viene `code`, se toman descripción/puntos/gravedad del catálogo (la nota
// libre se agrega aparte) y se arma el link de WhatsApp para avisar al padre.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const instId = session.user.institutionId
  const b = await req.json()

  let title = b.title || null
  let description = b.description || ""
  let severity = b.severity || "low"
  let code: string | null = null
  let points: number | null = null

  if (b.type !== "positive" && b.code) {
    const cc = await prisma.conductCode.findUnique({ where: { institutionId_code: { institutionId: instId, code: b.code } } })
    if (!cc) return NextResponse.json({ error: "Código no encontrado" }, { status: 400 })
    code = cc.code
    points = cc.points
    severity = cc.severity
    title = `${cc.code} · ${cc.categoryLabel}`
    description = b.note ? `${cc.description} — ${b.note}` : cc.description
  }

  const incident = await prisma.incident.create({
    data: {
      institutionId: instId,
      studentId: b.studentId,
      type: b.type === "positive" ? "positive" : "negative",
      title, description,
      severity,
      code, points,
      date: b.date ? new Date(b.date) : new Date(),
      reportedBy: session.user.name ?? null,
    },
  })

  // Link de WhatsApp para avisar al apoderado (mismo patrón que asistencia/scan)
  let waLink: string | null = null
  if (incident.type === "negative" && code) {
    const student = await prisma.student.findUnique({
      where: { id: b.studentId },
      include: { parents: { take: 1, orderBy: { id: "desc" } } },
    })
    const cfgs = await prisma.institutionConfig.findMany({ where: { institutionId: instId, key: { in: ["notifyOnConduct", "conductTemplate"] } } })
    const cfg: Record<string, string> = {}
    for (const c of cfgs) cfg[c.key] = c.value
    const notify = cfg.notifyOnConduct === "true"
    const phone = (student?.parents[0]?.phone ?? "").replace(/\D/g, "")

    if (notify && phone) {
      const defaultTemplate = "📋 Registro de conducta — {alumno}\nCódigo {codigo}: {descripcion}\nPuntos descontados: {puntos}\nFecha: {fecha}\n— I.E.P. Cristo Reina"
      const template = cfg.conductTemplate || defaultTemplate
      const fecha = incident.date.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })
      const msg = template
        .replaceAll("{alumno}", `${student!.firstName} ${student!.lastName}`)
        .replaceAll("{codigo}", code)
        .replaceAll("{descripcion}", description)
        .replaceAll("{puntos}", String(Math.abs(points ?? 0)))
        .replaceAll("{fecha}", fecha)
      waLink = `https://wa.me/51${phone}?text=${encodeURIComponent(msg)}`
    }
  }

  return NextResponse.json({ ...incident, waLink }, { status: 201 })
}
