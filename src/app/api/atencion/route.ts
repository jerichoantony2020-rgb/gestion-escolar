import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/atencion → lo que requiere acción hoy, para la pantalla de inicio.
 * Es lo primero que ve la dirección al entrar, así que todo lo que devuelve
 * tiene que ser accionable: si no hay nada pendiente, la lista viene vacía.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const instId = session.user.institutionId

  const now = new Date()
  const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const manana = new Date(hoy.getTime() + 86400000)
  const finde = hoy.getDay() === 0 || hoy.getDay() === 6

  // ── Aulas sin asistencia registrada hoy ──
  // Solo se cuentan las aulas que tienen alumnos matriculados; un aula vacía
  // no es una tarea pendiente. En fin de semana no hay clases, así que no
  // se reporta nada.
  let aulasSinAsistencia: string[] = []
  if (!finde) {
    const secciones = await prisma.section.findMany({
      where: { institutionId: instId, enrollments: { some: { active: true } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })
    const conRegistro = await prisma.attendanceRecord.findMany({
      where: { institutionId: instId, date: { gte: hoy, lt: manana } },
      select: { sectionId: true },
      distinct: ["sectionId"],
    })
    const marcadas = new Set(conRegistro.map(r => r.sectionId))
    aulasSinAsistencia = secciones.filter(s => !marcadas.has(s.id)).map(s => s.name)
  }

  // ── Pensiones vencidas ──
  const pensionesVencidas = await prisma.paymentOrder.count({
    where: {
      institutionId: instId,
      status: { not: "paid" },
      dueDate: { lt: now },
    },
  })

  // ── Derivaciones esperando a la psicóloga ──
  const derivacionesPendientes = await prisma.psychologicalDerivation.count({
    where: { institutionId: instId, status: "pendiente" },
  })

  return NextResponse.json({
    aulasSinAsistencia,
    pensionesVencidas,
    derivacionesPendientes,
    esFinDeSemana: finde,
  })
}
