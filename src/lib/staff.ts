import { prisma } from "@/lib/prisma"

// Roles que cuentan como "personal" (aparecen en el conteo de Docentes del
// dashboard y pueden recibir asignaciones de aula/curso). Los padres no.
const STAFF_ROLES = new Set(["docente", "coordinador", "director", "enfermera", "psicologo", "admin"])

/** Crea el registro de personal ligado al usuario si su rol lo amerita y aún no existe. */
export async function syncStaffForRole(institutionId: string, userId: string, role: string) {
  if (!STAFF_ROLES.has(role)) return
  const existing = await prisma.staff.findUnique({ where: { userId } })
  if (existing) {
    if (!existing.active) await prisma.staff.update({ where: { userId }, data: { active: true } })
    return
  }
  await prisma.staff.create({ data: { institutionId, userId, staffType: role, active: true } })
}
