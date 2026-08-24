"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

/**
 * Cabecera de página. Vive en el layout para que todas las pantallas abran
 * igual — campo azul con filete dorado — sin repetir el bloque en cada
 * archivo. El título sale de la ruta.
 */
const TITULOS: Record<string, { t: string; d?: string; volver?: string }> = {
  "/dashboard/academico/notas-area":  { t: "Registro de notas", d: "Notas por competencia · el promedio calcula el nivel de la libreta", volver: "/dashboard/academico" },
  "/dashboard/academico/asistencia":  { t: "Asistencia", d: "Control diario, semana, mes y consolidado del bimestre", volver: "/dashboard/academico" },
  "/dashboard/academico/conducta":    { t: "Conducta", d: "Códigos del reglamento y puntaje del bimestre", volver: "/dashboard/academico" },
  "/dashboard/academico/boletin":     { t: "Consultar notas", d: "Elige el aula, el alumno y el bimestre", volver: "/dashboard/academico" },
  "/dashboard/admin/alumnos":         { t: "Alumnos", d: "Matrícula, datos y fichas de los estudiantes", volver: "/dashboard/admin" },
  "/dashboard/admin/usuarios":        { t: "Usuarios", d: "Personal del colegio y los cursos que dicta cada uno", volver: "/dashboard/admin" },
  "/dashboard/admin/apoderados":      { t: "Apoderados", d: "Cuentas y códigos de acceso del portal familiar", volver: "/dashboard/admin" },
  "/dashboard/admin/aulas":           { t: "Niveles y aulas", d: "Inicial, Primaria, Secundaria y aulas polígrado", volver: "/dashboard/admin" },
  "/dashboard/admin/cursos":          { t: "Cursos", d: "Materias y escala de calificación por nivel", volver: "/dashboard/admin" },
  "/dashboard/admin/competencias":    { t: "Competencias", d: "Nombre del curso que ve el apoderado en cada competencia", volver: "/dashboard/admin" },
  "/dashboard/admin/anuncios":        { t: "Anuncios", d: "Comunicados institucionales", volver: "/dashboard/admin" },
  "/dashboard/admin/noticias":        { t: "Noticias", d: "Publicaciones de la página pública", volver: "/dashboard/admin" },
  "/dashboard/admin/actividades":     { t: "Actividades", d: "Actividades de la página pública", volver: "/dashboard/admin" },
  "/dashboard/admin/grados":          { t: "Grados y secciones", volver: "/dashboard/admin" },
  "/dashboard/admin/config":          { t: "Configuración", d: "Datos del colegio y plantillas de WhatsApp", volver: "/dashboard/admin" },
  "/dashboard/analitica":             { t: "Analítica", d: "Reportes e indicadores", volver: "/dashboard" },
  "/dashboard/biblioteca":            { t: "Biblioteca", d: "Recursos y plan lector", volver: "/dashboard" },
  "/dashboard/medico":                { t: "Médico", d: "Fichas de salud, alergias y tipo de sangre", volver: "/dashboard" },
  "/dashboard/psicologia":            { t: "Psicología", d: "Casos, sesiones e intervenciones", volver: "/dashboard" },
  "/dashboard/psicologia/derivaciones": { t: "Derivaciones", d: "Solicitudes de los docentes", volver: "/dashboard/psicologia" },
  "/dashboard/finanzas":              { t: "Finanzas", d: "Pensiones, pagos y recaudación", volver: "/dashboard" },
  "/dashboard/portal":                { t: "Portal familiar", d: "Notas, conducta, asistencia y pagos de tu hijo(a)" },
}

/** Rutas dinámicas: se resuelven por prefijo. */
const PREFIJOS: { p: string; t: string; d?: string; volver?: string }[] = [
  { p: "/dashboard/academico/informe/",     t: "Informe de progreso", d: "Consolidado de los cuatro bimestres", volver: "/dashboard/academico/boletin" },
  { p: "/dashboard/academico/actividades/", t: "Registro de actividades", d: "Notas numéricas de cada evaluación", volver: "/dashboard/academico/boletin" },
  { p: "/dashboard/psicologia/casos/",      t: "Caso", volver: "/dashboard/psicologia" },
]

export default function PageHeader() {
  const path = usePathname()
  if (!path || path === "/dashboard" || path === "/dashboard/academico" || path === "/dashboard/admin") return null

  const meta = TITULOS[path] ?? PREFIJOS.find(x => path.startsWith(x.p))
  if (!meta) return null

  return (
    <div className="brand-field page-head print:hidden">
      <div className="page-head-inner">
        {meta.volver && (
          <Link href={meta.volver} className="page-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Volver
          </Link>
        )}
        <h1 style={!meta.volver ? { paddingTop: 18 } : undefined}>{meta.t}</h1>
        {meta.d && <p>{meta.d}</p>}
      </div>
    </div>
  )
}
