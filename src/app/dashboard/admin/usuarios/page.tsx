"use client"

import { useState, useEffect } from "react"

type User = { id: string; name: string; email: string; role: string; canViewPayments: boolean; active: boolean }

const ROLES = ["director", "coordinador", "docente", "enfermera", "padre"]
const EMPTY = { name: "", email: "", password: "", role: "docente", canViewPayments: false, active: true }

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  async function load() {
    const data = await fetch("/api/usuarios").then(r => r.json())
    setUsers(data)
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
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Usuarios</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{users.filter(u => u.active).length} activos de {users.length}</p>
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
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {u.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
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
    </div>
  )
}
