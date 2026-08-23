"use client"

import { useState, useEffect, useCallback, Fragment } from "react"
import { currentBimestreNumber } from "@/lib/bimestre"

type Ctx = {
  courses: { id: string; name: string }[]
  sections: { id: string; name: string }[]
  pairs: { sectionId: string; courseId: string }[]
  periods: { id: string; name: string; number: number }[]
  role: string
}
type Row = { studentId: string; studentName: string; scores: (number | string)[][] }

const LEVEL_COLOR: Record<string, string> = { AD: "#16a34a", A: "#0ea5e9", B: "#f59e0b", C: "#ef4444" }
const DEFAULT_ACT_COUNT = 3

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
  const [actCounts, setActCounts] = useState<number[]>([])
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState("")

  useEffect(() => {
    fetch("/api/notas/area/contexto").then(r => r.json()).then((c: Ctx) => {
      setCtx(c)
      const firstSection = c.sections[0]?.id ?? ""
      setSectionId(firstSection)
      const firstCourse = c.pairs.find(p => p.sectionId === firstSection)?.courseId ?? ""
      setCourseId(firstCourse)
      if (c.periods.length) {
        const match = c.periods.find(p => p.number === currentBimestreNumber())
        setPeriodId(match?.id ?? c.periods[0].id)
      }
    })
  }, [])

  function onSectionChange(newSectionId: string) {
    setSectionId(newSectionId)
    const firstCourse = ctx?.pairs.find(p => p.sectionId === newSectionId)?.courseId ?? ""
    setCourseId(firstCourse)
  }

  const coursesForSection = ctx
    ? ctx.courses.filter(c => ctx.pairs.some(p => p.sectionId === sectionId && p.courseId === c.id))
    : []

  const load = useCallback(async () => {
    if (!courseId || !sectionId || !periodId) return
    setLoading(true)
    setDirty(false)
    const data = await fetch(`/api/notas/area?courseId=${courseId}&sectionId=${sectionId}&periodId=${periodId}`).then(r => r.json())
    setAreaName(data.areaName)
    setCompetencias(data.competencias)
    // scores por competencia = [...actividades, Evaluación Mensual, Evaluación Bimestral]
    // el número de actividades se detecta de lo ya guardado (largo - 2), o 3 por defecto.
    const counts = data.competencias.map((_: unknown, i: number) => {
      const maxLen = Math.max(0, ...data.rows.map((r: { scores: unknown[][] }) => (r.scores[i]?.length ?? 0)))
      return Math.max(DEFAULT_ACT_COUNT, maxLen - 2)
    })
    setActCounts(counts)
    setRows(data.rows.map((r: { studentId: string; studentName: string; scores: (number | string)[][] }) => ({
      ...r,
      scores: r.scores.map((s, i) => {
        const total = counts[i] + 2
        return Array.from({ length: total }, (_, j) => s[j] ?? "")
      }),
    })))
    setLoading(false)
  }, [courseId, sectionId, periodId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  function setScore(studentId: string, compIdx: number, colIdx: number, value: string) {
    setDirty(true)
    setRows(rs => rs.map(r => {
      if (r.studentId !== studentId) return r
      const scores = r.scores.map(s => [...s])
      scores[compIdx][colIdx] = value
      return { ...r, scores }
    }))
  }

  function changeActCount(compIdx: number, delta: number) {
    setDirty(true)
    setActCounts(counts => {
      const next = [...counts]
      next[compIdx] = Math.max(1, Math.min(8, next[compIdx] + delta))
      return next
    })
    setRows(rs => rs.map(r => {
      const scores = r.scores.map(s => [...s])
      const comp = scores[compIdx]
      const newActCount = Math.max(1, Math.min(8, actCounts[compIdx] + delta))
      const mensual = comp[comp.length - 2] ?? ""
      const bimestral = comp[comp.length - 1] ?? ""
      const acts = comp.slice(0, comp.length - 2)
      while (acts.length < newActCount) acts.push("")
      acts.length = newActCount
      scores[compIdx] = [...acts, mensual, bimestral]
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
    setDirty(false)
    setToast("Notas guardadas ✓")
    setTimeout(() => setToast(""), 2500)
    await load()
  }

  const totalCols = actCounts.reduce((sum, n) => sum + n + 4, 0) // +4 = mensual, bimestral, prom, nivel

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium shadow-lg">{toast}</div>
      )}

      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--fg)" }}>Registro de Notas por Competencia</h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        Notas numéricas (0–20) por competencia · Actividades + Evaluación Mensual + Evaluación Bimestral · el promedio calcula el nivel (AD/A/B/C) de la libreta
      </p>

      <div className="flex flex-wrap gap-3 mb-5 items-end">
        <Sel label="Sección" value={sectionId} onChange={onSectionChange} options={ctx?.sections.map(s => ({ value: s.id, label: s.name })) ?? []} />
        <Sel label="Curso" value={courseId} onChange={setCourseId} options={coursesForSection.map(c => ({ value: c.id, label: c.name }))} />
        <Sel label="Bimestre" value={periodId} onChange={setPeriodId} options={ctx?.periods.map(p => ({ value: p.id, label: p.name })) ?? []} />
      </div>

      {ctx && ctx.courses.length === 0 && (
        <div className="rounded-xl border p-6 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          No tienes cursos con competencias asignadas. Pide al Director que te asigne un curso desde Admin → Usuarios.
        </div>
      )}

      {areaName && (
        <div className="sticky top-16 z-30 flex items-center justify-between gap-3 py-2 mb-2" style={{ background: "var(--bg)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
            Área: {areaName}
            {dirty && <span className="ml-2 normal-case font-medium" style={{ color: "#f59e0b" }}>· cambios sin guardar</span>}
          </p>
          <button onClick={save} disabled={saving || !dirty}
            className="px-5 py-2 rounded-lg bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 disabled:opacity-40 shadow-sm">
            {saving ? "Guardando..." : "Guardar notas"}
          </button>
        </div>
      )}

      {loading && <p className="text-sm text-center py-8" style={{ color: "var(--muted)" }}>Cargando...</p>}

      {!loading && ctx && ctx.courses.length > 0 && competencias.length > 0 && (
        <div className="rounded-xl border overflow-x-auto" style={{ borderColor: "var(--border)" }}>
          <table className="text-sm border-collapse">
            <thead>
              <tr>
                <th rowSpan={2} className="text-left px-4 py-2 font-semibold text-xs uppercase tracking-wider sticky left-0 border-r" style={{ color: "var(--muted)", background: "var(--surface)", borderColor: "var(--border)" }}>Alumno</th>
                {competencias.map((comp, i) => (
                  <th key={comp.id} colSpan={actCounts[i] + 4} className="px-2 py-2 font-semibold text-xs border-r border-b" style={{ color: "var(--fg)", background: "var(--surface)", borderColor: "var(--border)" }}>
                    <div className="flex items-center justify-center gap-2">
                      <span>{comp.name}</span>
                      <span className="flex items-center gap-0.5">
                        <button type="button" onClick={() => changeActCount(i, -1)} className="w-5 h-5 rounded border text-xs leading-none" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>−</button>
                        <button type="button" onClick={() => changeActCount(i, 1)} className="w-5 h-5 rounded border text-xs leading-none" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>+</button>
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
              <tr>
                {competencias.map((comp, i) => (
                  <Fragment key={comp.id}>
                    {Array.from({ length: actCounts[i] }, (_, j) => (
                      <th key={`${comp.id}-act${j}`} className="px-1 py-2 font-medium text-[11px] whitespace-nowrap" style={{ color: "var(--muted)", background: "var(--surface)" }}>Act. {j + 1}</th>
                    ))}
                    <th className="px-1 py-2 font-medium text-[11px] whitespace-nowrap" style={{ color: "var(--muted)", background: "var(--surface)" }}>Ev. Mensual</th>
                    <th className="px-1 py-2 font-medium text-[11px] whitespace-nowrap border-r" style={{ color: "var(--muted)", background: "var(--surface)", borderColor: "var(--border)" }}>Ev. Bimestral</th>
                    <th className="px-2 py-2 font-semibold text-[11px] uppercase whitespace-nowrap" style={{ color: "var(--muted)", background: "var(--surface)" }}>Prom.</th>
                    <th className="px-2 py-2 font-semibold text-[11px] uppercase whitespace-nowrap border-r" style={{ color: "var(--muted)", background: "var(--surface)", borderColor: "var(--border)" }}>Nivel</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={totalCols + 1} className="text-center py-8 text-sm" style={{ color: "var(--muted)" }}>No hay alumnos en esta sección</td></tr>}
              {rows.map(r => (
                <tr key={r.studentId} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-2 font-medium whitespace-nowrap sticky left-0 border-r" style={{ color: "var(--fg)", background: "var(--bg)", borderColor: "var(--border)" }}>{r.studentName}</td>
                  {competencias.map((comp, compIdx) => {
                    const compScores = r.scores[compIdx] ?? []
                    const a = avg(compScores)
                    const lv = levelOf(a)
                    return (
                      <Fragment key={comp.id}>
                        {compScores.map((v, colIdx) => (
                          <td key={`${comp.id}-${colIdx}`} className="px-1 py-1.5">
                            <input type="number" min={0} max={20} value={String(v ?? "")}
                              onChange={e => setScore(r.studentId, compIdx, colIdx, e.target.value)}
                              className="w-12 px-1 py-1 rounded border text-xs text-center outline-none focus:ring-2 focus:ring-primary-500"
                              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
                          </td>
                        ))}
                        <td className="px-2 py-1.5 text-center font-bold text-xs" style={{ color: a == null ? "var(--muted)" : "var(--fg)" }}>{a ?? "—"}</td>
                        <td className="px-2 py-1.5 text-center font-bold text-xs border-r" style={{ color: lv ? LEVEL_COLOR[lv] : "var(--muted)", borderColor: "var(--border)" }}>{lv || "—"}</td>
                      </Fragment>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
