"use client"

import { useState, useEffect, useCallback } from "react"

type Ctx = {
  courses: { id: string; name: string }[]
  sections: { id: string; name: string }[]
  periods: { id: string; name: string; number: number }[]
  role: string
}
type Row = { studentId: string; studentName: string; scores: (number | string)[][] }

const LEVEL_COLOR: Record<string, string> = { AD: "#16a34a", A: "#0ea5e9", B: "#f59e0b", C: "#ef4444" }
const CRITERIA = ["Cuaderno", "Libro", "Evaluación Mensual", "Actividades", "Evaluación Bimestral"]

function avg(scores: (number | string)[]): number | null {
  const nums = scores.map(v => parseFloat(String(v))).filter(n => !isNaN(n))
  if (!nums.length) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
}
function levelOf(a: number | null): string {
  if (a == null) return ""
  if (a >= 18) return "AD"
  if (a >= 14) return "A"
  if (a >= 11) return "B"
  return "C"
}

export default function NotasAreaPage() {
  const [ctx, setCtx] = useState<Ctx | null>(null)
  const [courseId, setCourseId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [periodId, setPeriodId] = useState("")
  const [areaName, setAreaName] = useState("")
  const [competencias, setCompetencias] = useState<{ id: string; name: string }[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState("")

  useEffect(() => {
    fetch("/api/notas/area/contexto").then(r => r.json()).then((c: Ctx) => {
      setCtx(c)
      if (c.courses[0]) setCourseId(c.courses[0].id)
      if (c.sections[0]) setSectionId(c.sections[0].id)
      if (c.periods[0]) setPeriodId(c.periods[0].id)
    })
  }, [])

  const load = useCallback(async () => {
    if (!courseId || !sectionId || !periodId) return
    setLoading(true)
    const data = await fetch(`/api/notas/area?courseId=${courseId}&sectionId=${sectionId}&periodId=${periodId}`).then(r => r.json())
    setAreaName(data.areaName)
    setCompetencias(data.competencias)
    setRows(data.rows.map((r: { studentId: string; studentName: string; scores: (number | string)[][] }) => ({
      ...r,
      scores: r.scores.map(s => CRITERIA.map((_, i) => s[i] ?? "")),
    })))
    setLoading(false)
  }, [courseId, sectionId, periodId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  function setScore(studentId: string, compIdx: number, evalIdx: number, value: string) {
    setRows(rs => rs.map(r => {
      if (r.studentId !== studentId) return r
      const scores = r.scores.map(s => [...s])
      while (scores[compIdx].length <= evalIdx) scores[compIdx].push("")
      scores[compIdx][evalIdx] = value
      return { ...r, scores }
    }))
  }

  async function save() {
    setSaving(true)
    const records = rows.flatMap(r =>
      r.scores.map((scores, i) => ({ studentId: r.studentId, competenciaId: competencias[i].id, scores }))
    )
    await fetch("/api/notas/area", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, sectionId, periodId, records }),
    })
    setSaving(false)
    setToast("Notas guardadas ✓")
    setTimeout(() => setToast(""), 2500)
    await load()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium shadow-lg">{toast}</div>
      )}

      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--fg)" }}>Registro de Notas por Competencia</h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Ingresa notas numéricas (0–20) por criterio de evaluación · el sistema calcula el promedio y el nivel de logro (AD/A/B/C) que verán los padres en la libreta
      </p>

      <div className="flex flex-wrap gap-3 mb-5 items-end">
        <Sel label="Curso" value={courseId} onChange={setCourseId} options={ctx?.courses.map(c => ({ value: c.id, label: c.name })) ?? []} />
        <Sel label="Sección" value={sectionId} onChange={setSectionId} options={ctx?.sections.map(s => ({ value: s.id, label: s.name })) ?? []} />
        <Sel label="Bimestre" value={periodId} onChange={setPeriodId} options={ctx?.periods.map(p => ({ value: p.id, label: p.name })) ?? []} />
      </div>

      {ctx && ctx.courses.length === 0 && (
        <div className="rounded-xl border p-6 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          No tienes cursos con competencias asignadas. Pide al Director que te asigne un curso desde Admin → Usuarios.
        </div>
      )}

      {areaName && (
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>Área: {areaName}</p>
      )}

      {!loading && ctx && ctx.courses.length > 0 && competencias.map((comp, compIdx) => (
        <div key={comp.id} className="mb-6">
          <p className="text-sm font-semibold mb-2" style={{ color: "var(--fg)" }}>{comp.name}</p>
          <div className="rounded-xl border overflow-x-auto" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--surface)" }}>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider sticky left-0" style={{ color: "var(--muted)", background: "var(--surface)" }}>Alumno</th>
                  {CRITERIA.map((label, i) => <th key={i} className="px-2 py-3 font-semibold text-xs whitespace-nowrap" style={{ color: "var(--muted)" }}>{label}</th>)}
                  <th className="px-3 py-3 font-semibold text-xs uppercase" style={{ color: "var(--muted)" }}>Prom.</th>
                  <th className="px-3 py-3 font-semibold text-xs uppercase" style={{ color: "var(--muted)" }}>Nivel</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={CRITERIA.length + 3} className="text-center py-8 text-sm" style={{ color: "var(--muted)" }}>No hay alumnos en esta sección</td></tr>}
                {rows.map(r => {
                  const compScores = r.scores[compIdx] ?? []
                  const a = avg(compScores)
                  const lv = levelOf(a)
                  return (
                    <tr key={r.studentId} className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-2 font-medium whitespace-nowrap sticky left-0" style={{ color: "var(--fg)", background: "var(--bg)" }}>{r.studentName}</td>
                      {CRITERIA.map((_, i) => (
                        <td key={i} className="px-1 py-2">
                          <input type="number" min={0} max={20} value={String(compScores[i] ?? "")}
                            onChange={e => setScore(r.studentId, compIdx, i, e.target.value)}
                            className="w-14 px-1 py-1.5 rounded border text-sm text-center outline-none focus:ring-2 focus:ring-primary-500"
                            style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center font-bold" style={{ color: a == null ? "var(--muted)" : "var(--fg)" }}>{a ?? "—"}</td>
                      <td className="px-3 py-2 text-center font-bold" style={{ color: lv ? LEVEL_COLOR[lv] : "var(--muted)" }}>{lv || "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {loading && <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>Cargando...</p>}

      {rows.length > 0 && (
        <div className="flex justify-end mt-2">
          <button onClick={save} disabled={saving} className="px-6 py-2.5 rounded-lg bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 disabled:opacity-60">
            {saving ? "Guardando..." : "Guardar notas"}
          </button>
        </div>
      )}
    </div>
  )
}

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500 min-w-[140px]"
        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}>
        {options.length === 0 && <option value="">—</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
