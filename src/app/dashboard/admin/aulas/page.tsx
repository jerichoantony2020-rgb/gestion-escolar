"use client"

import { useState, useEffect } from "react"
import BackButton from "@/components/BackButton"

type Grade = { id: string; name: string }
type Level = { id: string; name: string; grades: Grade[] }
type Aula = { id: string; name: string; poligrado: boolean; levelId: string | null; levelName: string; grades: string[]; gradeIds: string[]; students: number }

export default function AulasPage() {
  const [levels, setLevels] = useState<Level[]>([])
  const [aulas, setAulas] = useState<Aula[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Aula | null>(null)
  const [levelId, setLevelId] = useState("")
  const [name, setName] = useState("")
  const [gradeIds, setGradeIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // gestión de niveles/grados
  const [newLevel, setNewLevel] = useState("")
  const [newGradeFor, setNewGradeFor] = useState("")
  const [newGrade, setNewGrade] = useState("")

  async function load() {
    const [lv, au] = await Promise.all([fetch("/api/niveles").then(r => r.json()), fetch("/api/aulas").then(r => r.json())])
    setLevels(lv); setAulas(au)
  }
  useEffect(() => { load() }, [])

  const currentGrades = levels.find(l => l.id === levelId)?.grades ?? []

  function openNew() { setEditing(null); setLevelId(levels[0]?.id ?? ""); setName(""); setGradeIds([]); setError(""); setModal(true) }
  function openEdit(a: Aula) {
    setEditing(a); setLevelId(a.levelId ?? ""); setName(a.name); setGradeIds(a.gradeIds); setError(""); setModal(true)
  }
  function toggleGrade(id: string) {
    setGradeIds(g => g.includes(id) ? g.filter(x => x !== id) : [...g, id])
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("")
    const url = editing ? `/api/aulas/${editing.id}` : "/api/aulas"
    const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ levelId, name, gradeIds }) })
    setSaving(false)
    if (!res.ok) { setError((await res.json()).error ?? "Error"); return }
    await load(); setModal(false)
  }

  async function removeAula(a: Aula) {
    if (!confirm(`¿Eliminar aula "${a.name}"?`)) return
    const res = await fetch(`/api/aulas/${a.id}`, { method: "DELETE" })
    if (!res.ok) { alert((await res.json()).error); return }
    await load()
  }

  async function addLevel() {
    if (!newLevel.trim()) return
    await fetch("/api/niveles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "level", name: newLevel }) })
    setNewLevel(""); await load()
  }
  async function addGrade() {
    if (!newGrade.trim() || !newGradeFor) return
    await fetch("/api/niveles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "grade", levelId: newGradeFor, name: newGrade }) })
    setNewGrade(""); await load()
  }

  // agrupar aulas por nivel
  const byLevel: Record<string, Aula[]> = {}
  for (const a of aulas) { (byLevel[a.levelName] ??= []).push(a) }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackButton href="/dashboard/admin" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Niveles y Aulas</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Aulas independientes o polígrado (varios grados juntos)</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600">+ Nueva aula</button>
      </div>

      {/* Aulas por nivel */}
      {Object.entries(byLevel).map(([lvl, list]) => (
        <div key={lvl} className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>{lvl}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {list.map(a => (
              <div key={a.id} className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: "var(--fg)" }}>{a.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                      {a.grades.join(", ")} {a.poligrado && <span className="ml-1 px-1.5 py-0.5 rounded bg-gold-100 text-gold-600 text-[10px] font-medium">Polígrado</span>}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{a.students} alumnos</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => openEdit(a)} className="text-xs px-2 py-1 rounded border hover:bg-primary-50 transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Editar</button>
                    <button onClick={() => removeAula(a)} className="text-xs px-2 py-1 rounded border hover:bg-red-50 hover:text-red-600 transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Eliminar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Gestión de niveles y grados */}
      <details className="mt-8 rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <summary className="cursor-pointer text-sm font-semibold" style={{ color: "var(--fg)" }}>Gestionar niveles y grados</summary>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>Agregar nivel</p>
            <div className="flex gap-2">
              <input value={newLevel} onChange={e => setNewLevel(e.target.value)} placeholder="Ej. Inicial" className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
              <button onClick={addLevel} className="px-3 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600">Agregar</button>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--muted)" }}>Agregar grado a un nivel</p>
            <div className="flex gap-2">
              <select value={newGradeFor} onChange={e => setNewGradeFor(e.target.value)} className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                <option value="">Nivel...</option>
                {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <input value={newGrade} onChange={e => setNewGrade(e.target.value)} placeholder="Ej. 1° Grado" className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
              <button onClick={addGrade} className="px-3 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600">Agregar</button>
            </div>
          </div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            {levels.map(l => <div key={l.id} className="mt-1"><b style={{ color: "var(--fg)" }}>{l.name}:</b> {l.grades.map(g => g.name).join(", ") || "sin grados"}</div>)}
          </div>
        </div>
      </details>

      {/* Modal aula */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <form onSubmit={save} className="space-y-3">
              <div className="sticky -top-6 z-10 flex items-center justify-between gap-3 -mx-6 px-6 pt-6 pb-3 -mt-6" style={{ background: "var(--bg)" }}>
                <h2 className="text-lg font-bold" style={{ color: "var(--fg)" }}>{editing ? "Editar aula" : "Nueva aula"}</h2>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => setModal(false)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Cancelar</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">{saving ? "Guardando..." : "Guardar aula"}</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Nivel *</label>
                <select required value={levelId} onChange={e => { setLevelId(e.target.value); setGradeIds([]) }} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                  <option value="">Seleccionar...</option>
                  {levels.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Nombre del aula *</label>
                <input required value={name} onChange={e => setName(e.target.value)} placeholder='Ej. "Amistosos" o "1° A"' className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Grados que cubre * <span className="font-normal" style={{ color: "var(--muted)" }}>(marca 2+ para polígrado)</span></label>
                <div className="flex flex-wrap gap-2">
                  {currentGrades.map(g => (
                    <button type="button" key={g.id} onClick={() => toggleGrade(g.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${gradeIds.includes(g.id) ? "bg-primary-500 text-white" : "border"}`}
                      style={gradeIds.includes(g.id) ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>
                      {g.name}
                    </button>
                  ))}
                  {currentGrades.length === 0 && <p className="text-xs" style={{ color: "var(--muted)" }}>Selecciona un nivel primero</p>}
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
