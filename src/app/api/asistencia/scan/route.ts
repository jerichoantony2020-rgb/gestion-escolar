import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { inicioDelDiaPeru, estadoDeIngreso, horaPeru } from "@/lib/fecha"

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

// POST /api/asistencia/scan  body {qrData, mode:'entry'|'exit'}
// Marca ingreso/salida del día por QR y devuelve datos para notificar al apoderado por WhatsApp
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const instId = session.user.institutionId
  const { qrData, mode } = await req.json()

  // localizar alumno por QR (formato CR-<studentId>) o por código en BD
  let studentId: string | null = null
  const qr = await prisma.studentQrCode.findFirst({ where: { institutionId: instId, qrData, active: true } })
  if (qr) studentId = qr.studentId
  else if (typeof qrData === "string" && qrData.startsWith("CR-")) studentId = qrData.slice(3)

  if (!studentId) return NextResponse.json({ error: "QR no reconocido" }, { status: 404 })

  const student = await prisma.student.findFirst({
    where: { id: studentId, institutionId: instId },
    include: {
      parents: { take: 1, orderBy: { id: "desc" } },
      enrollments: { where: { active: true }, take: 1, orderBy: { id: "desc" }, include: { section: { include: { grade: true } } } },
    },
  })
  if (!student) return NextResponse.json({ error: "Alumno no encontrado" }, { status: 404 })

  const enroll = student.enrollments[0]
  if (!enroll) return NextResponse.json({ error: "El alumno no tiene aula asignada" }, { status: 400 })

  const now = new Date()
  // Día peruano: escanear después de las 7 p.m. guardaba la asistencia
  // con la fecha del día siguiente.
  const day = inicioDelDiaPeru(now)
  // Modo automático: si aún no hay ingreso del día es una entrada; si ya lo
  // hay, es la salida. Así el operador no elige nada al escanear.
  const previo = await prisma.attendanceRecord.findFirst({
    where: { institutionId: instId, studentId, sectionId: enroll.sectionId, date: day },
  })
  const isExit = mode === "exit" || (mode === "auto" && !!previo?.entryAt)

  // Puntual hasta las 8:00 a.m. de Perú; después, tardanza. Antes se usaba
  // now.getHours(), que en el servidor es UTC: a las 7:30 de Lima daba 12:30
  // y marcaba tarde a todo el mundo.
  const status = isExit ? "present" : estadoDeIngreso(now)

  const existing = previo
  let record
  if (existing) {
    record = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: isExit ? { exitAt: now, scannedAt: now } : { entryAt: now, scannedAt: now, status: existing.status === "absent" ? status : existing.status },
    })
  } else {
    record = await prisma.attendanceRecord.create({
      data: { institutionId: instId, studentId, sectionId: enroll.sectionId, date: day, status: isExit ? "present" : status, ...(isExit ? { exitAt: now } : { entryAt: now }), scannedAt: now },
    })
  }

  // configuración de notificación
  const cfgs = await prisma.institutionConfig.findMany({ where: { institutionId: instId, key: { in: ["notifyOnScan", "scanEntryTemplate", "scanExitTemplate"] } } })
  const cfg: Record<string, string> = {}
  for (const c of cfgs) cfg[c.key] = c.value
  const notify = cfg.notifyOnScan === "true"

  const parent = student.parents[0]
  const hora = now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
  const defaultEntry = "👋 {alumno} ingresó al colegio a las {hora} del {fecha}. — I.E.P. Cristo Reina"
  const defaultExit = "🏠 {alumno} salió del colegio a las {hora} del {fecha}. — I.E.P. Cristo Reina"
  const template = isExit ? (cfg.scanExitTemplate || defaultExit) : (cfg.scanEntryTemplate || defaultEntry)
  const msg = template
    .replaceAll("{alumno}", `${student.firstName} ${student.lastName}`)
    .replaceAll("{hora}", hora)
    .replaceAll("{fecha}", `${now.getDate()} de ${MESES[now.getMonth()]}`)

  const phone = (parent?.phone ?? "").replace(/\D/g, "")
  const waLink = phone ? `https://wa.me/51${phone}?text=${encodeURIComponent(msg)}` : null

  return NextResponse.json({
    ok: true,
    studentName: `${student.lastName}, ${student.firstName}`,
    section: enroll.section.poligrado ? enroll.section.name : `${enroll.section.grade?.name ?? ""} "${enroll.section.name}"`,
    mode: isExit ? "exit" : "entry",
    status: record.status,
    time: hora,
    notify,
    waLink,
    parentPhone: parent?.phone ?? null,
  })
}
