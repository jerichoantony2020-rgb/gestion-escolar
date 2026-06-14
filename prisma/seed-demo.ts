import "dotenv/config"
import path from "path"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "../src/generated/prisma/client"

const dbUrl = process.env.DATABASE_URL?.startsWith("file:")
  ? process.env.DATABASE_URL
  : "file:" + path.resolve(process.cwd(), "dev.db")
const adapter = new PrismaLibSql({ url: dbUrl })
const prisma = new PrismaClient({ adapter } as any)

// ── Datos ficticios peruanos ─────────────────────────────────────────────────
const NOMBRES_M = ["Mateo", "Santiago", "Sebastián", "Dylan", "Adriano", "Gabriel", "Thiago", "Liam", "Joaquín", "Benjamín", "Fabián", "Rodrigo"]
const NOMBRES_F = ["Valentina", "Camila", "Luciana", "Ariana", "Mía", "Emma", "Antonella", "Renata", "Daniela", "Alessia", "Fernanda", "Micaela"]
const APELLIDOS = ["Quispe", "Mamani", "Flores", "Huamán", "Vargas", "Rojas", "Ramírez", "Torres", "Castillo", "Espinoza", "Cárdenas", "Vásquez", "Chávez", "Paredes", "Salazar", "Núñez", "Gutiérrez", "Mendoza", "Ríos", "Aguilar"]
const NOMBRES_APO = ["María", "Rosa", "Carmen", "Juana", "Luz", "José", "Carlos", "Luis", "Pedro", "Ana"]

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randDni(): string { return String(70000000 + Math.floor(Math.random() * 9999999)) }
function randPhone(): string { return "9" + String(10000000 + Math.floor(Math.random() * 89999999)) }

async function main() {
  console.log("🌱 Generando datos de prueba...")

  const institution = await prisma.institution.findFirst({ where: { slug: "cristo-reina" } })
  if (!institution) throw new Error("Ejecuta primero el seed base (prisma db seed)")
  const instId = institution.id

  const year = await prisma.institutionYear.findFirst({ where: { institutionId: instId, active: true } })
  if (!year) throw new Error("No hay año académico activo")

  // ── Períodos académicos: 4 bimestres ──────────────────────────────────────
  const bimestres = [
    { number: 1, name: "I Bimestre", startDate: new Date("2026-03-01"), endDate: new Date("2026-05-15") },
    { number: 2, name: "II Bimestre", startDate: new Date("2026-05-16"), endDate: new Date("2026-07-25") },
    { number: 3, name: "III Bimestre", startDate: new Date("2026-08-10"), endDate: new Date("2026-10-15") },
    { number: 4, name: "IV Bimestre", startDate: new Date("2026-10-16"), endDate: new Date("2026-12-19") },
  ]
  for (const b of bimestres) {
    const exists = await prisma.academicPeriod.findFirst({ where: { yearId: year.id, number: b.number } })
    if (!exists) {
      await prisma.academicPeriod.create({ data: { institutionId: instId, yearId: year.id, ...b } })
    }
  }
  console.log("✅ 4 bimestres creados")

  // ── Cursos de Primaria ─────────────────────────────────────────────────────
  const primaria = await prisma.level.findFirst({ where: { institutionId: instId, name: "Primaria" } })
  const cursosDef = [
    { name: "Comunicación", code: "COM", gradeType: "qualitative" },
    { name: "Matemática", code: "MAT", gradeType: "qualitative" },
    { name: "Personal Social", code: "PS", gradeType: "qualitative" },
    { name: "Ciencia y Tecnología", code: "CYT", gradeType: "qualitative" },
    { name: "Arte y Cultura", code: "ART", gradeType: "qualitative" },
    { name: "Educación Física", code: "EF", gradeType: "qualitative" },
    { name: "Educación Religiosa", code: "REL", gradeType: "qualitative" },
    { name: "Inglés", code: "ING", gradeType: "quantitative" },
  ]
  const courses = []
  for (const c of cursosDef) {
    let course = await prisma.course.findFirst({ where: { institutionId: instId, name: c.name } })
    if (!course) {
      course = await prisma.course.create({
        data: { institutionId: instId, levelId: primaria?.id, name: c.name, code: c.code, gradeType: c.gradeType, active: true },
      })
    }
    courses.push(course)
  }
  console.log(`✅ ${courses.length} cursos creados`)

  // ── Staff para la docente demo ─────────────────────────────────────────────
  const docente = await prisma.user.findFirst({ where: { institutionId: instId, email: "docente@cristoreina.edu.pe" } })
  let staff = null
  if (docente) {
    staff = await prisma.staff.findFirst({ where: { userId: docente.id } })
    if (!staff) {
      staff = await prisma.staff.create({ data: { institutionId: instId, userId: docente.id, staffType: "docente", active: true } })
    }
  }

  // ── Secciones ──────────────────────────────────────────────────────────────
  const sections = await prisma.section.findMany({
    where: { institutionId: instId },
    include: { grade: true },
    orderBy: { grade: { order: "asc" } },
  })
  if (sections.length === 0) throw new Error("No hay secciones")

  // ── Asignar la docente a todos los cursos de la 1ra sección ───────────────
  if (staff && sections[0]) {
    for (const course of courses) {
      const exists = await prisma.courseAssignment.findFirst({
        where: { staffId: staff.id, sectionId: sections[0].id, courseId: course.id, yearId: year.id },
      })
      if (!exists) {
        await prisma.courseAssignment.create({
          data: { institutionId: instId, staffId: staff.id, sectionId: sections[0].id, courseId: course.id, yearId: year.id, evalCount: 4 },
        })
      }
    }
    console.log(`✅ Docente asignada a ${courses.length} cursos de ${sections[0].grade.name}`)
  }

  // ── Alumnos: ~4 por sección ────────────────────────────────────────────────
  const existingStudents = await prisma.student.count({ where: { institutionId: instId } })
  if (existingStudents > 0) {
    console.log(`⏭️  Ya existen ${existingStudents} alumnos, omitiendo generación`)
  } else {
    let total = 0
    for (const section of sections) {
      const cantidad = 4 + Math.floor(Math.random() * 2) // 4-5
      for (let i = 0; i < cantidad; i++) {
        const esVaron = Math.random() > 0.5
        const firstName = esVaron ? rand(NOMBRES_M) : rand(NOMBRES_F)
        const lastName = `${rand(APELLIDOS)} ${rand(APELLIDOS)}`

        const student = await prisma.student.create({
          data: {
            institutionId: instId,
            firstName,
            lastName,
            dni: randDni(),
            gender: esVaron ? "M" : "F",
            active: true,
          },
        })

        await prisma.studentEnrollment.create({
          data: { institutionId: instId, studentId: student.id, sectionId: section.id, yearId: year.id, active: true },
        })

        await prisma.studentParent.create({
          data: {
            institutionId: instId,
            studentId: student.id,
            name: `${rand(NOMBRES_APO)} ${rand(APELLIDOS)}`,
            phone: randPhone(),
            monthlyFee: 150,
            relationship: "apoderado",
          },
        })

        await prisma.studentQrCode.create({
          data: { institutionId: instId, studentId: student.id, qrData: `CR-${student.id}`, active: true },
        })

        total++
      }
    }
    console.log(`✅ ${total} alumnos generados con apoderado, pensión y QR`)
  }

  console.log("\n🎉 Datos de prueba listos!")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
