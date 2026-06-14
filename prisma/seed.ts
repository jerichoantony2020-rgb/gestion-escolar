import "dotenv/config"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import bcrypt from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log("🌱 Seeding database...")

  // ── Institution ────────────────────────────────────────────────────────────
  const institution = await prisma.institution.upsert({
    where: { slug: "cristo-reina" },
    update: {},
    create: {
      name: "I.E.P. Cristo Reina",
      slug: "cristo-reina",
      active: true,
    },
  })
  console.log(`✅ Institución: ${institution.name} (id: ${institution.id})`)

  // ── Institution config (key/value) ─────────────────────────────────────────
  const configs: { key: string; value: string }[] = [
    { key: "defaultMonthlyFee",       value: "150" },
    { key: "paymentReminderTemplate", value: "Estimado apoderado de {alumno}, le recordamos que la pensión de {mes} de {anio} por S/ {monto} está pendiente. — I.E.P. Cristo Reina" },
    { key: "overdueTemplate",         value: "Apoderado de {alumno}: tiene una deuda de S/ {monto} correspondiente a {mes} de {anio}. Por favor regularice su situación. — I.E.P. Cristo Reina" },
    { key: "ugel",                    value: "UGEL 06 Ate-Vitarte" },
  ]
  for (const cfg of configs) {
    await prisma.institutionConfig.upsert({
      where: { institutionId_key: { institutionId: institution.id, key: cfg.key } },
      update: { value: cfg.value },
      create: { institutionId: institution.id, ...cfg },
    })
  }
  console.log(`✅ Configuración institucional guardada`)

  // ── Academic year 2026 ─────────────────────────────────────────────────────
  let year = await prisma.institutionYear.findFirst({
    where: { institutionId: institution.id, year: 2026 },
  })
  if (!year) {
    year = await prisma.institutionYear.create({
      data: {
        institutionId: institution.id,
        year: 2026,
        active: true,
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-12-19"),
      },
    })
  }
  console.log(`✅ Año académico 2026 (id: ${year.id})`)

  // ── Roles (global, not per-institution) ───────────────────────────────────
  const roleDefs: { name: string; label: string }[] = [
    { name: "director",     label: "Director" },
    { name: "coordinador",  label: "Coordinador" },
    { name: "docente",      label: "Docente" },
    { name: "admin",        label: "Administrador" },
    { name: "padre",        label: "Padre de familia" },
    { name: "enfermera",    label: "Enfermera" },
    { name: "superadmin",   label: "Superadministrador" },
  ]
  const rolesMap: Record<string, string> = {}
  for (const r of roleDefs) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { label: r.label },
      create: r,
    })
    rolesMap[r.name] = role.id
  }
  console.log(`✅ Roles: ${roleDefs.map((r) => r.name).join(", ")}`)

  // ── Superadmin ─────────────────────────────────────────────────────────────
  const saHash = await bcrypt.hash("SuperAdmin2026!", 12)
  await prisma.superadmin.upsert({
    where: { email: "superadmin@gestion.edu.pe" },
    update: {},
    create: { email: "superadmin@gestion.edu.pe", name: "Superadministrador", passwordHash: saHash },
  })

  // ── Users ──────────────────────────────────────────────────────────────────
  type UserSeed = { email: string; name: string; password: string; role: string; canViewPayments: boolean }
  const users: UserSeed[] = [
    { email: "director@cristoreina.edu.pe",      name: "Director General",    password: "Director2026!",  role: "director",    canViewPayments: true },
    { email: "subdirectora@cristoreina.edu.pe",  name: "Subdirectora",        password: "Subdir2026!",    role: "coordinador", canViewPayments: true },
    { email: "coordinador@cristoreina.edu.pe",   name: "Coordinador Primaria",password: "Coord2026!",     role: "coordinador", canViewPayments: false },
    { email: "docente@cristoreina.edu.pe",       name: "María García López",  password: "Docente2026!",   role: "docente",     canViewPayments: false },
  ]

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12)
    const user = await prisma.user.upsert({
      where: { institutionId_email: { institutionId: institution.id, email: u.email } },
      update: {},
      create: {
        institutionId: institution.id,
        email: u.email,
        name: u.name,
        passwordHash: hash,
        canViewPayments: u.canViewPayments,
        active: true,
      },
    })
    await prisma.userRole.upsert({
      where: { userId_roleId_institutionId: { userId: user.id, roleId: rolesMap[u.role], institutionId: institution.id } },
      update: {},
      create: { userId: user.id, roleId: rolesMap[u.role], institutionId: institution.id },
    })
  }
  console.log(`✅ Usuarios creados: ${users.map((u) => u.email).join(", ")}`)

  // ── Levels ─────────────────────────────────────────────────────────────────
  const levelDefs = [
    { name: "Inicial",     order: 1 },
    { name: "Primaria",    order: 2 },
    { name: "Secundaria",  order: 3 },
  ]
  const levelsMap: Record<string, string> = {}
  for (const ld of levelDefs) {
    let level = await prisma.level.findFirst({ where: { institutionId: institution.id, name: ld.name } })
    if (!level) {
      level = await prisma.level.create({ data: { institutionId: institution.id, ...ld } })
    }
    levelsMap[ld.name] = level.id
  }

  // ── Grades & Sections (Primaria 1°–6°) ────────────────────────────────────
  const primariaId = levelsMap["Primaria"]
  for (let g = 1; g <= 6; g++) {
    const gradeName = `${g}° Grado`
    let grade = await prisma.grade.findFirst({
      where: { institutionId: institution.id, levelId: primariaId, name: gradeName },
    })
    if (!grade) {
      grade = await prisma.grade.create({
        data: { institutionId: institution.id, levelId: primariaId, name: gradeName, order: g },
      })
    }
    const exists = await prisma.section.findFirst({
      where: { institutionId: institution.id, gradeId: grade.id, name: "A" },
    })
    if (!exists) {
      await prisma.section.create({
        data: { institutionId: institution.id, gradeId: grade.id, name: "A" },
      })
    }
  }
  console.log(`✅ Grados y secciones de Primaria creados`)

  // ── BillingConcept: Pensión mensual ────────────────────────────────────────
  let pension = await prisma.billingConcept.findFirst({
    where: { institutionId: institution.id, name: "Pensión mensual" },
  })
  if (!pension) {
    pension = await prisma.billingConcept.create({
      data: { institutionId: institution.id, name: "Pensión mensual", amount: 150.0, active: true },
    })
  }
  console.log(`✅ Concepto de pago creado`)

  console.log("\n🎉 Seed completado exitosamente!")
  console.log("\n📋 Credenciales de acceso:")
  console.log("  Superadmin:    superadmin@gestion.edu.pe     /  SuperAdmin2026!")
  console.log("  Director:      director@cristoreina.edu.pe   /  Director2026!  (puede ver pagos)")
  console.log("  Subdirectora:  subdirectora@cristoreina.edu.pe / Subdir2026!   (puede ver pagos)")
  console.log("  Coordinador:   coordinador@cristoreina.edu.pe / Coord2026!")
  console.log("  Docente:       docente@cristoreina.edu.pe    /  Docente2026!")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
