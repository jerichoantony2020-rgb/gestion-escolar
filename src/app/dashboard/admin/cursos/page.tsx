"use client"

import { useState, useEffect } from "react"
import BackButton from "@/components/BackButton"

type Level = { id: string; name: string }
type Course = { id: string; name: string; code: string | null; gradeType: string; levelId: string | null; levelName: string }

const EMPTY = { name: "", code: "", levelId: "", gradeType: "quantitative" }

export default function CursosPage() {
  const [levels, setLevels] = useState<Level[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Course | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  async function load() {
    const [lv, cs] = await Promise.all([fetch("/api/niveles").then(r => r.json()), fetch("/api/cursos").then(r => r.json())])
    setLevels(lv); setCourses(cs)
  }
  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm({ ...EMPTY, levelId: levels[0]?.id ?? "" }); setModal(true) }
  function openEdit(c: Course) {
    setEditing(c); setForm({ name: c.name, code: c.code ?? "", levelId: c.levelId ?? "", gradeType: c.gradeType }); setModal(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const url = editing ? `/api/cursos/${editing.id}` : "/api/cursos"
    await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    await load(); setModal(false); setSaving(false)
  }

  async function remove(c: Course) {
    if (!confirm(`¿Eliminar curso "${c.name}"?`)) return
    await fetch(`/api/cursos/${c.id}`, { method: "DELETE" }); await load()
  }

  const byLevel: Record<string, Course[]> = {}
  for (const c of courses) { (byLevel[c.levelName] ??= []).push(c) }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackButton href="/dashboard/admin" />
      <div className="flex items-center justify-between mb-6">
        <button onClick={openNew} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600">+ Nuevo curso</button>
      </div>

      {Object.keys(byLevel).length === 0 && <p className="text-center py-10 text-sm" style={{ color: "var(--muted)" }}>No hay cursos. Crea el primero.</p>}

      {Object.entries(byLevel).map(([lvl, list]) => (
        <div key={lvl} className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>{lvl}</h2>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--surface)" }}>
                  {["Curso", "Código", "Escala", ""].map(h => <th key={h} className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {list.map(c => (
                  <tr key={c.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: "var(--fg)" }}>{c.name}</td>
                    <td className="px-4 py-2.5" style={{ color: "var(--muted)" }}>{c.code ?? "—"}</td>
                    <td className="px-4 py-2.5">
                      {c.gradeType === "qualitative"
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-medium">Literal AD/A/B/C</span>
                        : <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">Numérica 0-20</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => openEdit(c)} className="text-xs px-2 py-1 rounded border hover:bg-primary-50 transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Editar</button>
                        <button onClick={() => remove(c)} className="text-xs px-2 py-1 rounded border hover:bg-red-50 hover:text-red-600 transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-xl" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--fg)" }}>{editing ? "Editar curso" : "Nuevo curso"}</h2>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Nombre *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Código</label>
                  <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="MAT" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Nivel</label>
                <select value={form.levelId} onChange={e => setForm(f => ({ ...f, levelId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                  <option value="">General (todos)</option>
                  {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--fg)" }}>Escala de calificación *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setForm(f => ({ ...f, gradeType: "quantitative" }))}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${form.gradeType === "quantitative" ? "bg-primary-500 text-white" : "border"}`}
                    style={form.gradeType === "quantitative" ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>
                    Numérica<br /><span className="text-xs font-normal">0 – 20</span>
                  </button>
                  <button type="button" onClick={() => setForm(f => ({ ...f, gradeType: "qualitative" }))}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${form.gradeType === "qualitative" ? "bg-primary-500 text-white" : "border"}`}
                    style={form.gradeType === "qualitative" ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>
                    Literal<br /><span className="text-xs font-normal">AD / A / B / C</span>
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">{saving ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
