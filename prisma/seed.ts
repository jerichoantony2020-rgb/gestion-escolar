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
    { name: "psicologo",    label: "Psicólogo/a" },
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
    { email: "psicologa@cristoreina.edu.pe",     name: "Psicóloga",           password: "Psicol2026!",    role: "psicologo",   canViewPayments: false },
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
  }
  console.log(`✅ Grados de Primaria creados`)

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

  // ── Catálogo de conducta (reglamento interno) ───────────────────────────────
  type ConductSeed = { category: string; categoryLabel: string; points: number; severity: string; items: string[] }
  const conductSeed: ConductSeed[] = [
    { category: "A", categoryLabel: "Asistencia y Puntualidad", points: -2, severity: "leve", items: [
      "Inasistencias injustificadas",
      "Llegar tarde al colegio",
      "Salida injustificada del aula",
      "Retraso a clase y/o formación",
    ] },
    { category: "B", categoryLabel: "Aseo y Presentación", points: -2, severity: "leve", items: [
      "Falta de aseo personal (uniforme o cuerpo sucio)",
      "Presentación incorrecta (uñas largas pintadas, maquillaje, cabello suelto en alumnas, mal vestido, etc.)",
      "Uniforme o distintivos incompletos (moñera, carmín, cordones, medias, etc.)",
      "Aditamentos o prendas que alteren el uso correcto del uniforme (joyas u otros)",
      "Asistir con el uniforme que no corresponda al día de clases",
      "Deteriorar y/o hacer pintas en el uniforme, buzo, mochila o prendas escolares",
    ] },
    { category: "C", categoryLabel: "Obediencia y Responsabilidad", points: -2, severity: "leve", items: [
      "Retener o no presentar oportunamente la documentación escolar (citaciones, exámenes, agenda, comunicados, etc.)",
      "No presentar firmada y/o sellada la agenda (comunicados, exámenes y/o citaciones)",
      "Negarse a presentar la agenda estudiantil a las autoridades del colegio",
      "No presentar tareas, asignaciones y útiles escolares",
      "No pegar los comunicados, exámenes mensuales y bimestrales",
      "Consumir golosinas o similares en horas de clase",
    ] },
    { category: "D", categoryLabel: "Comportamiento en el Aula o Dentro del Plantel", points: -3, severity: "grave", items: [
      "No portar la agenda estudiantil",
      "Reiteradamente no presentar tareas, cuadernos o libros",
      "Ser retirado del aula por incumplimiento reiterado de tareas",
      "Ingresar o salir por puertas que no correspondan en la entrada y/o salida",
      "Incumplir una orden encomendada por un(a) profesor(a) o autoridad del colegio",
      "Ingresar a ambientes no autorizados (aulas, oficinas, laboratorios, etc.)",
      "Tener revistas o publicaciones que atenten contra su buena formación",
      "Traer objetos no autorizados — serán decomisados (celulares, mp3-4, iPod, juegos, etc.)",
      "Faltar al colegio el día de actividades programadas (visitas, viajes, olimpiadas, etc.)",
      "Permanecer en el patio después del timbre, en el salón durante el recreo o en el colegio tras el horario de salida sin autorización",
      "Falta de respeto a sus compañeros(as)",
      "Lenguaje incorrecto o soez",
      "Faltar a la verdad (mentira, injuria, etc.)",
      "Participar o generar indisciplina y/o desorden dentro o fuera del aula",
      "Ser retirado del aula por indisciplina reiteradamente",
      "No asistir a formación",
    ] },
    { category: "E", categoryLabel: "Faltas Muy Graves (Consejo Disciplinario)", points: -5, severity: "muy_grave", items: [
      "No asistir intencionalmente a clases",
      "Evadirse y/o salir sin autorización del colegio",
      "Arrancar, adulterar o falsificar documentos oficiales del colegio y/o agenda estudiantil",
      "Conducta que atente contra la moral y las buenas costumbres",
      "Faltar a la honradez (robo y/o soborno)",
      "Intento de copia, fraude o indisciplina en exámenes o evaluaciones (2da vez)",
      "Insubordinación (acto de rebeldía)",
      "Presentarse bajo efectos de sustancias nocivas para la salud (etílico, drogado, etc.)",
      "Promover, introducir o participar en el consumo de sustancias tóxicas (alcohol, drogas, etc.)",
      "Portar o usar negativamente armas u objetos punzocortantes",
      "Promover o estar vinculado a grupos que atenten contra la institución y las buenas costumbres",
      "Deteriorar, pintar o destruir el material educativo, mobiliario o infraestructura del colegio (el padre de familia será responsable de reponer los daños)",
      "Concurrir a lugares que perturben su formación escolar con uniforme del colegio (play station, discotecas, cabinas de internet, etc.)",
      "Agredir a compañeros(as) y/o promover riñas o peleas dentro o fuera del colegio",
      "Participar en acciones que involucren negativamente la imagen institucional del colegio",
      "Falta de respeto al personal directivo, docentes, administrativo o de servicio",
      "Incumplimiento de compromisos con el colegio",
      "Discriminar o faltar el respeto a compañeros(as) o personal por internet: fotos, videos, comentarios — ciberbullying",
    ] },
  ]

  let conductCount = 0
  for (const cat of conductSeed) {
    for (let i = 0; i < cat.items.length; i++) {
      const code = `${cat.category}${i + 1}`
      await prisma.conductCode.upsert({
        where: { institutionId_code: { institutionId: institution.id, code } },
        update: { categoryLabel: cat.categoryLabel, description: cat.items[i], points: cat.points, severity: cat.severity, order: i + 1 },
        create: { institutionId: institution.id, code, category: cat.category, categoryLabel: cat.categoryLabel, description: cat.items[i], points: cat.points, severity: cat.severity, order: i + 1 },
      })
      conductCount++
    }
  }
  console.log(`✅ Catálogo de conducta: ${conductCount} códigos`)

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
