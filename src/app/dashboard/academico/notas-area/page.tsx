"use client"

import { useState, useEffect, useCallback } from "react"

type Ctx = {
  courses: { id: string; name: string }[]
  sections: { id: string; name: string }[]
  periods: { id: string; name: string; number: number }[]
  role: string
}
type Row = { studentId: string; studentName: string; levels: string[] }

const LEVELS = ["AD", "A", "B", "C"]
const LEVEL_COLOR: Record<string, string> = {
  AD: "#16a34a", A: "#0ea5e9", B: "#f59e0b", C: "#ef4444",
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
    setRows(data.rows.map((r: Row) => ({ ...r, levels: [...r.levels] })))
    setLoading(false)
  }, [courseId, sectionId, periodId])

  useEffect(() => { load() }, [load])

  function setLevel(studentId: string, idx: number, value: string) {
    setRows(rs => rs.map(r => {
      if (r.studentId !== studentId) return r
      const levels = [...r.levels]
      levels[idx] = value
      return { ...r, levels }
    }))
  }

  async function save() {
    setSaving(true)
    const records = rows.flatMap(r =>
      r.levels.map((level, i) => ({ studentId: r.studentId, competenciaId: competencias[i].id, level }))
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
        Escala MINEDU: AD (logro destacado) · A (logro esperado) · B (en proceso) · C (en inicio)
      </p>

      <div className="flex flex-wrap gap-3 mb-5">
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

      {ctx && ctx.courses.length > 0 && (
        <div className="rounded-xl border overflow-x-auto" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--surface)" }}>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider sticky left-0" style={{ color: "var(--muted)", background: "var(--surface)" }}>Alumno</th>
                {competencias.map(c => (
                  <th key={c.id} className="px-2 py-3 font-semibold text-xs text-left max-w-[180px]" style={{ color: "var(--muted)" }}>{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={competencias.length + 1} className="text-center py-10 text-sm" style={{ color: "var(--muted)" }}>Cargando...</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={competencias.length + 1} className="text-center py-10 text-sm" style={{ color: "var(--muted)" }}>No hay alumnos en esta sección</td></tr>}
              {!loading && rows.map(r => (
                <tr key={r.studentId} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-2 font-medium whitespace-nowrap sticky left-0" style={{ color: "var(--fg)", background: "var(--bg)" }}>{r.studentName}</td>
                  {r.levels.map((lv, i) => (
                    <td key={i} className="px-2 py-2">
                      <select
                        value={lv}
                        onChange={e => setLevel(r.studentId, i, e.target.value)}
                        className="w-16 px-1 py-1.5 rounded border text-sm text-center font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                        style={{ background: "var(--bg)", borderColor: "var(--border)", color: lv ? LEVEL_COLOR[lv] : "var(--muted)" }}
                      >
                        <option value=""></option>
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
