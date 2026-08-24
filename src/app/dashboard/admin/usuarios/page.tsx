"use client"

import { useState, useEffect } from "react"

type User = { id: string; name: string; email: string; role: string; canViewPayments: boolean; active: boolean }
type Section = { id: string; name: string; levelId: string | null; levelName: string }
type Course = { id: string; name: string; levelId: string | null; levelName: string }
type Assignment = { id: string; sectionId: string; sectionName: string; courseId: string; courseName: string }

const ROLES = ["director", "coordinador", "docente", "enfermera", "psicologo"]
const EMPTY = { name: "", email: "", password: "", role: "docente", canViewPayments: false, active: true }
const ASSIGNABLE_ROLES = new Set(["docente", "coordinador", "enfermera"])

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  // Asignación de aulas / cursos
  const [assignUser, setAssignUser] = useState<User | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [newAssign, setNewAssign] = useState({ sectionId: "", courseId: "" })
  const [assignSaving, setAssignSaving] = useState(false)

  async function load() {
    const data: User[] = await fetch("/api/usuarios").then(r => r.json())
    // Esta pantalla es solo personal del colegio. Los apoderados viven en
    // Admin -> Apoderados, que además maneja su código familiar y su vínculo
    // con el alumno.
    setUsers(data.filter(u => u.role !== "padre"))
  }

  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm(EMPTY); setModal(true) }

  function openEdit(u: User) {
    setEditing(u)
    setForm({ name: u.name, email: u.email, password: "", role: u.role, canViewPayments: u.canViewPayments, active: u.active })
    setModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const url = editing ? `/api/usuarios/${editing.id}` : "/api/usuarios"
    const method = editing ? "PUT" : "POST"
    const body = { ...form }
    if (editing && !body.password) delete (body as any).password
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    await load(); setModal(false); setSaving(false)
  }

  async function toggleActive(u: User) {
    await fetch(`/api/usuarios/${u.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...u, active: !u.active }) })
    await load()
  }

  async function openAssign(u: User) {
    setAssignUser(u)
    setNewAssign({ sectionId: "", courseId: "" })
    const [aulas, cursos, asigs] = await Promise.all([
      fetch("/api/aulas").then(r => r.json()),
      fetch("/api/cursos").then(r => r.json()),
      fetch(`/api/usuarios/${u.id}/asignaciones`).then(r => r.json()),
    ])
    setSections(aulas.map((a: { id: string; name: string; levelId: string | null; levelName: string }) => ({ id: a.id, name: a.name, levelId: a.levelId, levelName: a.levelName })))
    setCourses(cursos)
    setAssignments(asigs)
  }

  async function addAssignment(e: React.FormEvent) {
    e.preventDefault()
    if (!assignUser || !newAssign.sectionId || !newAssign.courseId) return
    setAssignSaving(true)
    await fetch(`/api/usuarios/${assignUser.id}/asignaciones`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newAssign),
    })
    const asigs = await fetch(`/api/usuarios/${assignUser.id}/asignaciones`).then(r => r.json())
    setAssignments(asigs)
    setNewAssign({ sectionId: "", courseId: "" })
    setAssignSaving(false)
  }

  async function removeAssignment(a: Assignment) {
    if (!assignUser) return
    await fetch(`/api/usuarios/${assignUser.id}/asignaciones/${a.id}`, { method: "DELETE" })
    setAssignments(prev => prev.filter(x => x.id !== a.id))
  }

  const roleColor = (r: string) => ({
    director: "bg-primary-100 text-primary-700",
    coordinador: "bg-sky-100 text-sky-700",
    docente: "bg-green-100 text-green-700",
    enfermera: "bg-pink-100 text-pink-700",
    padre: "bg-orange-100 text-orange-700",
  }[r] ?? "bg-gray-100 text-gray-700")

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Personal del colegio · {users.filter(u => u.active).length} activos de {users.length}</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors">
          + Nuevo usuario
        </button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface)" }}>
              {["Nombre", "Correo", "Rol", "Pagos", "Estado", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t hover:bg-primary-50/20 transition-colors" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3 font-medium" style={{ color: u.active ? "var(--fg)" : "var(--muted)" }}>{u.name}</td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor(u.role)}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  {u.canViewPayments ? <span className="text-xs text-green-600 font-medium">✓ Sí</span> : <span className="text-xs" style={{ color: "var(--muted)" }}>—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                    {u.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {ASSIGNABLE_ROLES.has(u.role) && (
                      <button onClick={() => openAssign(u)} className="text-xs px-2 py-1 rounded border hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Asignar cursos</button>
                    )}
                    <button onClick={() => openEdit(u)} className="text-xs px-2 py-1 rounded border hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300 transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Editar</button>
                    <button onClick={() => toggleActive(u)} className={`text-xs px-2 py-1 rounded border transition-colors ${u.active ? "hover:bg-red-50 hover:text-red-600 hover:border-red-300" : "hover:bg-green-50 hover:text-green-600 hover:border-green-300"}`} style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                      {u.active ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-xl" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--fg)" }}>{editing ? "Editar usuario" : "Nuevo usuario"}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              {[
                { label: "Nombre completo *", key: "name", required: true },
                { label: "Correo electrónico *", key: "email", required: true },
                { label: editing ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *", key: "password", required: !editing, type: "password" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>{f.label}</label>
                  <input type={f.type ?? "text"} required={f.required} value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Rol</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.canViewPayments} onChange={e => setForm(f => ({ ...f, canViewPayments: e.target.checked }))} className="rounded" />
                <span className="text-sm" style={{ color: "var(--fg)" }}>Puede ver el módulo de Finanzas/Pagos</span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">
                  {saving ? "Guardando..." : editing ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl border p-6 shadow-xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: "var(--fg)" }}>Aulas y cursos de {assignUser.name}</h2>
            <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>Define en qué aula(s) y qué curso(s) dicta este año. Esto controla qué ve en Notas, Conducta y Asistencia.</p>

            {assignments.length === 0 && (
              <p className="text-xs mb-3 px-3 py-2 rounded-lg bg-amber-50 text-amber-700">Sin asignaciones todavía — no verá ninguna aula hasta que agregues al menos una.</p>
            )}
            {assignments.length > 0 && (
              <div className="space-y-1.5 mb-4">
                {assignments.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <span className="text-sm" style={{ color: "var(--fg)" }}>{a.sectionName} <span style={{ color: "var(--muted)" }}>· {a.courseName}</span></span>
                    <button onClick={() => removeAssignment(a)} className="text-xs px-2 py-1 rounded border hover:bg-red-50 hover:text-red-600 transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Quitar</button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={addAssignment} className="flex flex-wrap gap-2 items-end p-3 rounded-lg" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Aula</label>
                <select required value={newAssign.sectionId} onChange={e => setNewAssign({ sectionId: e.target.value, courseId: "" })} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                  <option value="">Seleccionar...</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.levelName} — {s.name}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Curso</label>
                <select required disabled={!newAssign.sectionId} value={newAssign.courseId} onChange={e => setNewAssign(f => ({ ...f, courseId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none disabled:opacity-50" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                  <option value="">{newAssign.sectionId ? "Seleccionar..." : "Elige un aula primero"}</option>
                  {courses
                    .filter(c => !c.levelId || c.levelId === sections.find(s => s.id === newAssign.sectionId)?.levelId)
                    .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" disabled={assignSaving} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">
                {assignSaving ? "..." : "+ Agregar"}
              </button>
            </form>

            <div className="flex justify-end pt-4">
              <button onClick={() => setAssignUser(null)} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
