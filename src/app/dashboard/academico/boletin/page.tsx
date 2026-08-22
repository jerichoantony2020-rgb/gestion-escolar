"use client"

import { useState, useEffect } from "react"

type Student = { id: string; firstName: string; lastName: string; enrollments: { section: { id: string; name: string; grade: { name: string } } }[] }
type Period = { id: string; name: string }
type Boletin = { studentName: string; section: string; period: string; courses: { courseName: string; display: string; gradeType: string }[] }

export default function BoletinPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [studentId, setStudentId] = useState("")
  const [periodId, setPeriodId] = useState("")
  const [boletin, setBoletin] = useState<Boletin | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch("/api/alumnos").then(r => r.json()).then(setStudents)
    fetch("/api/notas/contexto").then(r => r.json()).then(c => {
      setPeriods(c.periods)
      if (c.periods[0]) setPeriodId(c.periods[0].id)
    })
  }, [])

  useEffect(() => {
    if (!studentId || !periodId) { setBoletin(null); return }
    setLoading(true)
    fetch(`/api/boletin?studentId=${studentId}&periodId=${periodId}`).then(r => r.json()).then(b => { setBoletin(b); setLoading(false) })
  }, [studentId, periodId])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--fg)" }}>Boletín de Notas</h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Consulta las calificaciones por alumno y bimestre</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Alumno</label>
          <select value={studentId} onChange={e => setStudentId(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500 min-w-[220px]"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}>
            <option value="">Seleccionar alumno...</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Bimestre</label>
          <select value={periodId} onChange={e => setPeriodId(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
            style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}>
            {periods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {studentId && (
        <div className="flex flex-wrap gap-4 mb-4">
          <a href={`/dashboard/academico/informe/${studentId}`} className="text-sm font-semibold text-primary-500 hover:underline">
            Ver Informe de Progreso completo (formato MINEDU) →
          </a>
          <a href={`/dashboard/academico/actividades/${studentId}`} className="text-sm font-semibold text-primary-500 hover:underline">
            Ver Registro de Actividades (notas numéricas) →
          </a>
        </div>
      )}

      {loading && <p className="text-sm" style={{ color: "var(--muted)" }}>Cargando...</p>}

      {boletin && !loading && (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <div className="px-5 py-4 border-b" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="font-bold" style={{ color: "var(--fg)" }}>{boletin.studentName}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{boletin.section} · {boletin.period}</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface)" }}>
                <th className="text-left px-5 py-2 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>Curso</th>
                <th className="text-center px-5 py-2 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>Calificación</th>
              </tr>
            </thead>
            <tbody>
              {boletin.courses.length === 0 && (
                <tr><td colSpan={2} className="text-center py-8 text-sm" style={{ color: "var(--muted)" }}>Sin notas registradas en este bimestre</td></tr>
              )}
              {boletin.courses.map(c => (
                <tr key={c.courseName} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-5 py-2.5" style={{ color: "var(--fg)" }}>{c.courseName}</td>
                  <td className="px-5 py-2.5 text-center font-bold text-lg" style={{ color: c.display === "—" ? "var(--muted)" : "var(--primary-500, #1b3d8f)" }}>
                    <span className="text-primary-500">{c.display}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
