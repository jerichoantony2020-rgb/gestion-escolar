"use client"

import { useState, useEffect, useCallback } from "react"
import BackButton from "@/components/BackButton"

type Section = { id: string; name: string }
type Student = { id: string; firstName: string; lastName: string }
type Incident = { id: string; studentId: string; studentName: string; type: string; title: string | null; description: string; severity: string; date: string }

export default function ConductaPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [sectionId, setSectionId] = useState("")
  const [students, setStudents] = useState<Student[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ studentId: "", type: "negative", title: "", description: "", severity: "low", date: new Date().toISOString().slice(0, 10) })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/secciones").then(r => r.json()).then((s: Section[]) => { setSections(s); if (s[0]) setSectionId(s[0].id) })
    fetch("/api/alumnos").then(r => r.json()).then(setStudents)
  }, [])

  const load = useCallback(async () => {
    if (!sectionId) return
    const data = await fetch(`/api/conducta?sectionId=${sectionId}`).then(r => r.json())
    setIncidents(data)
  }, [sectionId])
  useEffect(() => { load() }, [load])

  function openNew() {
    setForm({ studentId: "", type: "negative", title: "", description: "", severity: "low", date: new Date().toISOString().slice(0, 10) })
    setModal(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch("/api/conducta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    await load(); setModal(false); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar incidencia?")) return
    await fetch(`/api/conducta/${id}`, { method: "DELETE" }); await load()
  }

  // alumnos de la sección elegida (para el selector del modal)
  const sectionStudents = students // el endpoint /alumnos trae todos; filtramos por sección no trivial aquí, mostramos todos

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackButton href="/dashboard/academico" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Conducta</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Incidencias y reconocimientos · los padres lo ven en su portal</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600">+ Registrar</button>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Aula</label>
        <select value={sectionId} onChange={e => setSectionId(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}>
          {sections.length === 0 && <option value="">Sin aulas</option>}
          {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {incidents.length === 0 && <div className="rounded-xl border p-8 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><p className="text-sm" style={{ color: "var(--muted)" }}>Sin incidencias registradas en esta aula</p></div>}
        {incidents.map(i => (
          <div key={i.id} className="rounded-xl border p-4 flex items-start gap-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${i.type === "positive" ? "bg-green-500" : i.severity === "high" ? "bg-red-500" : "bg-amber-500"}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm" style={{ color: "var(--fg)" }}>{i.studentName}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${i.type === "positive" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{i.type === "positive" ? "Reconocimiento" : "Incidencia"}</span>
                {i.title && <span className="text-xs font-medium" style={{ color: "var(--fg)" }}>· {i.title}</span>}
              </div>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{i.description}</p>
              <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>{new Date(i.date).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            <button onClick={() => remove(i.id)} className="text-xs px-2 py-1 rounded border hover:bg-red-50 hover:text-red-600 transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Eliminar</button>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--fg)" }}>Registrar conducta</h2>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Alumno *</label>
                <select required value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                  <option value="">Seleccionar...</option>
                  {sectionStudents.map(s => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm(f => ({ ...f, type: "negative" }))} className={`px-3 py-2 rounded-lg text-sm font-medium ${form.type === "negative" ? "bg-red-500 text-white" : "border"}`} style={form.type === "negative" ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>Incidencia</button>
                <button type="button" onClick={() => setForm(f => ({ ...f, type: "positive" }))} className={`px-3 py-2 rounded-lg text-sm font-medium ${form.type === "positive" ? "bg-green-500 text-white" : "border"}`} style={form.type === "positive" ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>Reconocimiento</button>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Título</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ej. Llegó tarde / Ayudó a un compañero" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Descripción *</label>
                <textarea required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {form.type === "negative" && (
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Gravedad</label>
                    <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                      <option value="low">Leve</option>
                      <option value="medium">Moderada</option>
                      <option value="high">Grave</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Fecha</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">{saving ? "Guardando..." : "Registrar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
