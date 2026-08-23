"use client"

import { useState, useEffect } from "react"

type Student = { id: string; firstName: string; lastName: string; enrollments: { section: { id: string; name: string } }[] }
type Section = { id: string; name: string; levelName: string }
type Period = { id: string; name: string }
type Competencia = { id: string; name: string; scores: (number | string)[]; finalScore: number | null; level: string }
type Area = { id: string; name: string; competencias: Competencia[]; areaScore: number | null; areaLevel: string }
type Boletin = {
  studentName: string; section: string; grade: string; level: string; period: string
  areas: Area[]; hasAnyGrade: boolean
}

const LEVEL_COLOR: Record<string, string> = { AD: "#16a34a", A: "#0ea5e9", B: "#f59e0b", C: "#ef4444" }

export default function BoletinPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [sectionId, setSectionId] = useState("")
  const [studentId, setStudentId] = useState("")
  const [periodId, setPeriodId] = useState("")
  const [boletin, setBoletin] = useState<Boletin | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/alumnos").then(r => r.json()).then(setStudents)
    fetch("/api/aulas").then(r => r.json()).then((a: Section[]) => {
      setSections(a)
      if (a[0]) setSectionId(a[0].id)
    })
    fetch("/api/notas/area/contexto").then(r => r.json()).then(c => {
      setPeriods(c.periods)
      if (c.periods[0]) setPeriodId(c.periods[0].id)
    })
  }, [])

  // Al cambiar de aula, se limpia el alumno elegido (ya no pertenece a esa lista).
  useEffect(() => { setStudentId(""); setBoletin(null) }, [sectionId])

  useEffect(() => {
    if (!studentId || !periodId) { setBoletin(null); return }
    setLoading(true)
    fetch(`/api/boletin?studentId=${studentId}&periodId=${periodId}`)
      .then(r => r.json()).then(b => { setBoletin(b); setLoading(false) })
  }, [studentId, periodId])

  const studentsInSection = students.filter(s => s.enrollments?.some(e => e.section?.id === sectionId))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--fg)" }}>Consultar Notas</h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Elige el aula, el alumno y el bimestre</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <Sel label="Aula" value={sectionId} onChange={setSectionId}
          options={sections.map(s => ({ value: s.id, label: `${s.name} · ${s.levelName}` }))} />
        <Sel label="Alumno" value={studentId} onChange={setStudentId} minW="220px"
          placeholder={studentsInSection.length ? "Seleccionar alumno..." : "Sin alumnos en esta aula"}
          options={studentsInSection.map(s => ({ value: s.id, label: `${s.lastName}, ${s.firstName}` }))} />
        <Sel label="Bimestre" value={periodId} onChange={setPeriodId}
          options={periods.map(p => ({ value: p.id, label: p.name }))} />
      </div>

      {studentId && (
        <div className="flex flex-wrap gap-4 mb-4">
          <a href={`/dashboard/academico/informe/${studentId}`} className="text-sm font-semibold text-primary-500 hover:underline">
            Ver Informe de Progreso completo (los 4 bimestres) →
          </a>
          <a href={`/dashboard/academico/actividades/${studentId}`} className="text-sm font-semibold text-primary-500 hover:underline">
            Ver Registro de Actividades →
          </a>
        </div>
      )}

      {loading && <p className="text-sm" style={{ color: "var(--muted)" }}>Cargando...</p>}

      {boletin && !loading && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="px-5 py-4 border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="font-bold" style={{ color: "var(--fg)" }}>{boletin.studentName}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {[boletin.level, boletin.grade, boletin.section].filter(Boolean).join(" · ")} · {boletin.period}
            </p>
          </div>

          {!boletin.hasAnyGrade && (
            <p className="text-center py-10 text-sm" style={{ color: "var(--muted)" }}>Sin notas registradas en este bimestre</p>
          )}

          {boletin.hasAnyGrade && boletin.areas.filter(a => a.areaScore != null).map(area => (
            <div key={area.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between px-5 py-2.5" style={{ background: "var(--surface)" }}>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "var(--fg)" }}>{area.name}</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold" style={{ color: "var(--fg)" }}>{area.areaScore ?? "—"}</span>
                  <span className="text-sm font-bold w-7 text-center" style={{ color: area.areaLevel ? LEVEL_COLOR[area.areaLevel] : "var(--muted)" }}>{area.areaLevel || "—"}</span>
                </div>
              </div>
              {area.competencias.filter(c => c.finalScore != null).map(c => (
                <div key={c.id} className="flex items-center justify-between gap-3 px-5 py-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <p className="text-sm flex-1" style={{ color: "var(--muted)" }}>{c.name}</p>
                  <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>{c.finalScore}</span>
                  <span className="text-sm font-bold w-7 text-center" style={{ color: c.level ? LEVEL_COLOR[c.level] : "var(--muted)" }}>{c.level || "—"}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Sel({ label, value, onChange, options, placeholder, minW = "150px" }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; placeholder?: string; minW?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)", minWidth: minW }}>
        {placeholder && <option value="">{placeholder}</option>}
        {!placeholder && options.length === 0 && <option value="">—</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
