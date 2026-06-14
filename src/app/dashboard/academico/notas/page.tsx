"use client"

import { useState, useEffect, useCallback } from "react"

type Ctx = {
  courses: { id: string; name: string; gradeType: string }[]
  sections: { id: string; name: string }[]
  periods: { id: string; name: string; number: number }[]
  role: string
}
type Row = {
  studentId: string
  studentName: string
  scores: (number | string)[]
  finalGrade: number | null
  qualitative: string | null
  observation: string
}

const LETTERS = ["AD", "A", "B", "C"]

function avgQuant(scores: (number | string)[]): string {
  const nums = scores.map(v => parseFloat(String(v))).filter(n => !isNaN(n))
  if (!nums.length) return "—"
  return (Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100).toFixed(1)
}
function avgQual(scores: (number | string)[]): string {
  const map: Record<string, number> = { C: 1, B: 2, A: 3, AD: 4 }
  const pts = scores.map(v => map[String(v)]).filter(Boolean)
  if (!pts.length) return "—"
  const avg = pts.reduce((a, b) => a + b, 0) / pts.length
  if (avg >= 3.5) return "AD"
  if (avg >= 2.5) return "A"
  if (avg >= 1.5) return "B"
  return "C"
}

export default function NotasPage() {
  const [ctx, setCtx] = useState<Ctx | null>(null)
  const [courseId, setCourseId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [periodId, setPeriodId] = useState("")
  const [evalCount, setEvalCount] = useState(4)
  const [rows, setRows] = useState<Row[]>([])
  const [gradeType, setGradeType] = useState("quantitative")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState("")

  useEffect(() => {
    fetch("/api/notas/contexto").then(r => r.json()).then((c: Ctx) => {
      setCtx(c)
      if (c.courses[0]) setCourseId(c.courses[0].id)
      if (c.sections[0]) setSectionId(c.sections[0].id)
      if (c.periods[0]) setPeriodId(c.periods[0].id)
    })
  }, [])

  const load = useCallback(async () => {
    if (!courseId || !sectionId || !periodId) return
    setLoading(true)
    const data = await fetch(`/api/notas?courseId=${courseId}&sectionId=${sectionId}&periodId=${periodId}`).then(r => r.json())
    setGradeType(data.gradeType)
    const maxScores = Math.max(evalCount, ...data.rows.map((r: Row) => r.scores.length), 1)
    setEvalCount(Math.max(maxScores, 4))
    setRows(data.rows.map((r: Row) => ({ ...r, scores: [...r.scores] })))
    setLoading(false)
  }, [courseId, sectionId, periodId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  function setScore(studentId: string, idx: number, value: string) {
    setRows(rs => rs.map(r => {
      if (r.studentId !== studentId) return r
      const scores = [...r.scores]
      while (scores.length <= idx) scores.push("")
      scores[idx] = value
      return { ...r, scores }
    }))
  }

  async function save() {
    setSaving(true)
    await fetch("/api/notas", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId, sectionId, periodId, gradeType,
        records: rows.map(r => ({ studentId: r.studentId, scores: r.scores, observation: r.observation })),
      }),
    })
    setSaving(false)
    setToast("Notas guardadas ✓")
    setTimeout(() => setToast(""), 2500)
    await load()
  }

  const isQual = gradeType === "qualitative"
  const evalCols = Array.from({ length: evalCount }, (_, i) => i)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium shadow-lg">{toast}</div>
      )}

      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--fg)" }}>Registro de Notas</h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Escala {isQual ? "literal (AD / A / B / C)" : "numérica (0–20)"} · promedio automático
      </p>

      {/* Selectores */}
      <div className="flex flex-wrap gap-3 mb-5">
        <Sel label="Curso" value={courseId} onChange={setCourseId} options={ctx?.courses.map(c => ({ value: c.id, label: c.name })) ?? []} />
        <Sel label="Sección" value={sectionId} onChange={setSectionId} options={ctx?.sections.map(s => ({ value: s.id, label: s.name })) ?? []} />
        <Sel label="Bimestre" value={periodId} onChange={setPeriodId} options={ctx?.periods.map(p => ({ value: p.id, label: p.name })) ?? []} />
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Evaluaciones</label>
          <div className="flex items-center gap-1">
            <button onClick={() => setEvalCount(c => Math.max(1, c - 1))} className="w-8 h-9 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--fg)" }}>−</button>
            <span className="w-8 text-center text-sm font-medium" style={{ color: "var(--fg)" }}>{evalCount}</span>
            <button onClick={() => setEvalCount(c => Math.min(10, c + 1))} className="w-8 h-9 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--fg)" }}>+</button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border overflow-x-auto" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface)" }}>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider sticky left-0" style={{ color: "var(--muted)", background: "var(--surface)" }}>Alumno</th>
              {evalCols.map(i => <th key={i} className="px-2 py-3 font-semibold text-xs" style={{ color: "var(--muted)" }}>Ev {i + 1}</th>)}
              <th className="px-3 py-3 font-semibold text-xs uppercase" style={{ color: "var(--muted)" }}>Prom.</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={evalCount + 2} className="text-center py-10 text-sm" style={{ color: "var(--muted)" }}>Cargando...</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={evalCount + 2} className="text-center py-10 text-sm" style={{ color: "var(--muted)" }}>No hay alumnos en esta sección</td></tr>}
            {!loading && rows.map(r => {
              const prom = isQual ? avgQual(r.scores) : avgQuant(r.scores)
              return (
                <tr key={r.studentId} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-2 font-medium whitespace-nowrap sticky left-0" style={{ color: "var(--fg)", background: "var(--bg)" }}>{r.studentName}</td>
                  {evalCols.map(i => (
                    <td key={i} className="px-1 py-2">
                      {isQual ? (
                        <select value={String(r.scores[i] ?? "")} onChange={e => setScore(r.studentId, i, e.target.value)}
                          className="w-16 px-1 py-1.5 rounded border text-sm text-center outline-none focus:ring-2 focus:ring-primary-500"
                          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                          <option value=""></option>
                          {LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                      ) : (
                        <input type="number" min={0} max={20} value={String(r.scores[i] ?? "")} onChange={e => setScore(r.studentId, i, e.target.value)}
                          className="w-14 px-1 py-1.5 rounded border text-sm text-center outline-none focus:ring-2 focus:ring-primary-500"
                          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-bold" style={{ color: prom === "—" ? "var(--muted)" : "var(--fg)" }}>{prom}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div className="flex justify-end mt-4">
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
