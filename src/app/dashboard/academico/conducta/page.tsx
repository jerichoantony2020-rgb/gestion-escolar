"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import BackButton from "@/components/BackButton"

type Section = { id: string; name: string }
type Student = { id: string; firstName: string; lastName: string }
type Incident = {
  id: string; studentId: string; studentName: string; type: string
  title: string | null; description: string; severity: string
  code: string | null; points: number | null; date: string
}
type ConductCode = { id: string; code: string; category: string; categoryLabel: string; description: string; points: number; severity: string; order: number }
type ScoreRow = { studentId: string; studentName: string; baseScore: number; deducted: number; score: number; incidentCount: number }

const SEVERITY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  leve: { bg: "#FEF3C7", text: "#92400E", label: "Leve" },
  grave: { bg: "#FFEDD5", text: "#9A3412", label: "Grave" },
  muy_grave: { bg: "#FEE2E2", text: "#991B1B", label: "Muy grave" },
}

function scoreColor(score: number) {
  if (score >= 17) return { text: "#16A34A", bg: "#DCFCE7" }
  if (score >= 12) return { text: "#B45309", bg: "#FEF3C7" }
  return { text: "#DC2626", bg: "#FEE2E2" }
}

export default function ConductaPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [sectionId, setSectionId] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [codes, setCodes] = useState<ConductCode[]>([])
  const [scores, setScores] = useState<ScoreRow[]>([])
  const [bimestreLabel, setBimestreLabel] = useState("")
  const [view, setView] = useState<"resumen" | "historial">("resumen")

  const [modal, setModal] = useState(false)
  const [category, setCategory] = useState("A")
  const [form, setForm] = useState({ studentId: "", type: "negative" as "negative" | "positive", code: "", note: "", title: "", description: "", date: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)
  const [waLink, setWaLink] = useState<string | null>(null)
  const [toast, setToast] = useState("")

  useEffect(() => {
    fetch("/api/secciones").then(r => r.json()).then((s: Section[]) => { setSections(s); if (s[0]) setSectionId(s[0].id) })
    fetch("/api/alumnos").then(r => r.json()).then(setStudents)
    fetch("/api/conducta/codigos").then(r => r.json()).then(setCodes)
  }, [])

  const load = useCallback(async () => {
    if (!sectionId) return
    const [inc, sum] = await Promise.all([
      fetch(`/api/conducta?sectionId=${sectionId}`).then(r => r.json()),
      fetch(`/api/conducta/resumen?sectionId=${sectionId}`).then(r => r.json()),
    ])
    setIncidents(inc)
    setScores(sum.rows ?? [])
    setBimestreLabel(sum.bimestre ?? "")
  }, [sectionId])
  useEffect(() => { load() }, [load])

  const sectionStudentIds = useMemo(() => new Set(scores.map(s => s.studentId)), [scores])
  const sectionStudents = useMemo(() => students.filter(s => sectionStudentIds.has(s.id)), [students, sectionStudentIds])
  const codesByCategory = useMemo(() => {
    const m: Record<string, ConductCode[]> = {}
    for (const c of codes) (m[c.category] ??= []).push(c)
    return m
  }, [codes])
  const selectedCode = codes.find(c => c.code === form.code)

  function openNew() {
    setForm({ studentId: "", type: "negative", code: "", note: "", title: "", description: "", date: new Date().toISOString().slice(0, 10) })
    setCategory("A")
    setWaLink(null)
    setModal(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const body = form.type === "positive"
      ? { studentId: form.studentId, type: "positive", title: form.title, description: form.description, date: form.date }
      : { studentId: form.studentId, type: "negative", code: form.code, note: form.note, date: form.date }
    const res = await fetch("/api/conducta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json())
    setSaving(false)
    await load()
    if (res.waLink) {
      setWaLink(res.waLink)
    } else {
      setModal(false)
      setToast("Registrado ✓")
      setTimeout(() => setToast(""), 2000)
    }
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar incidencia?")) return
    await fetch(`/api/conducta/${id}`, { method: "DELETE" }); await load()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {toast && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium shadow-lg">{toast}</div>}
      <BackButton href="/dashboard/academico" />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Conducta</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Reglamento por códigos · descuenta puntos de conducta · avisa al apoderado</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600">+ Registrar</button>
      </div>

      <div className="flex flex-wrap gap-3 items-end mb-5">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Aula</label>
          <select value={sectionId} onChange={e => setSectionId(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}>
            {sections.length === 0 && <option value="">Sin aulas</option>}
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          {[{ k: "resumen", l: "Puntaje del bimestre" }, { k: "historial", l: "Historial" }].map(o => (
            <button key={o.k} onClick={() => setView(o.k as "resumen" | "historial")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${view === o.k ? "bg-primary-500 text-white" : "border"}`}
              style={view === o.k ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {/* RESUMEN: puntaje acumulado del bimestre */}
      {view === "resumen" && (
        <div>
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
            {bimestreLabel} · todos parten de 20 puntos; se descuenta lo acumulado en faltas con código.
          </p>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {scores.length === 0 && <p className="text-center py-10 text-sm" style={{ color: "var(--muted)" }}>Sin alumnos en esta aula</p>}
            {scores.map((s, i) => {
              const col = scoreColor(s.score)
              return (
                <div key={s.studentId} className="flex items-center justify-between px-4 py-2.5 border-t first:border-t-0" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{i + 1}.</span>
                    <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>{s.studentName}</span>
                    {s.incidentCount > 0 && <span className="text-xs" style={{ color: "var(--muted)" }}>{s.incidentCount} falta{s.incidentCount !== 1 ? "s" : ""} · -{s.deducted} pts</span>}
                  </div>
                  <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: col.bg, color: col.text }}>{s.score}/20</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* HISTORIAL: lista de incidencias */}
      {view === "historial" && (
        <div className="space-y-2">
          {incidents.length === 0 && <div className="rounded-xl border p-8 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><p className="text-sm" style={{ color: "var(--muted)" }}>Sin incidencias registradas en esta aula</p></div>}
          {incidents.map(i => {
            const sev = i.severity && SEVERITY_STYLE[i.severity]
            return (
              <div key={i.id} className="rounded-xl border p-4 flex items-start gap-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${i.type === "positive" ? "bg-green-500" : i.severity === "muy_grave" ? "bg-red-600" : i.severity === "grave" ? "bg-orange-500" : "bg-amber-500"}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: "var(--fg)" }}>{i.studentName}</span>
                    {i.code && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{i.code}</span>}
                    {i.points != null && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700">{i.points} pts</span>}
                    {sev && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: sev.bg, color: sev.text }}>{sev.label}</span>}
                    {i.type === "positive" && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Reconocimiento</span>}
                  </div>
                  <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{i.description}</p>
                  <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>{new Date(i.date).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <button onClick={() => remove(i.id)} className="text-xs px-2 py-1 rounded border hover:bg-red-50 hover:text-red-600 transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Eliminar</button>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl border p-6 shadow-xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            {waLink ? (
              <>
                <h2 className="text-lg font-bold mb-2" style={{ color: "var(--fg)" }}>Registrado ✓</h2>
                <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>¿Avisas al apoderado por WhatsApp ahora?</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => { setModal(false); setWaLink(null) }} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Ahora no</button>
                  <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={() => { setModal(false); setWaLink(null) }}
                    className="px-4 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90" style={{ background: "#25D366" }}>
                    Avisar por WhatsApp
                  </a>
                </div>
              </>
            ) : (
              <form onSubmit={save} className="space-y-3">
                <h2 className="text-lg font-bold mb-1" style={{ color: "var(--fg)" }}>Registrar conducta</h2>

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setForm(f => ({ ...f, type: "negative" }))} className={`px-3 py-2 rounded-lg text-sm font-medium ${form.type === "negative" ? "bg-red-500 text-white" : "border"}`} style={form.type === "negative" ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>Falta (código)</button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, type: "positive" }))} className={`px-3 py-2 rounded-lg text-sm font-medium ${form.type === "positive" ? "bg-green-500 text-white" : "border"}`} style={form.type === "positive" ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>Reconocimiento</button>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Alumno *</label>
                  <select required value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                    <option value="">Seleccionar...</option>
                    {sectionStudents.map(s => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>)}
                  </select>
                </div>

                {form.type === "negative" ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Categoría</label>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.keys(codesByCategory).map(cat => (
                          <button key={cat} type="button" onClick={() => setCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${category === cat ? "bg-primary-500 text-white" : "border"}`}
                            style={category === cat ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>
                            {cat} — {codesByCategory[cat]?.[0]?.categoryLabel.slice(0, 22)}{codesByCategory[cat]?.[0]?.categoryLabel.length > 22 ? "…" : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Código *</label>
                      <select required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                        <option value="">Seleccionar código...</option>
                        {(codesByCategory[category] ?? []).map(c => (
                          <option key={c.code} value={c.code}>{c.code} — {c.description} ({c.points} pts)</option>
                        ))}
                      </select>
                      {selectedCode && (
                        <p className="text-xs mt-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: SEVERITY_STYLE[selectedCode.severity]?.bg, color: SEVERITY_STYLE[selectedCode.severity]?.text }}>
                          {selectedCode.description} · descuenta {Math.abs(selectedCode.points)} puntos
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Nota adicional (opcional)</label>
                      <textarea rows={2} value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Detalle del hecho, si hace falta" className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Título</label>
                      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej. Ayudó a un compañero" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Descripción *</label>
                      <textarea required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Fecha</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Cancelar</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">{saving ? "Guardando..." : "Registrar"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
