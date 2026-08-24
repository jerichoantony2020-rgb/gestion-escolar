"use client"

import { useState, useEffect } from "react"

type Student = { id: string; firstName: string; lastName: string; parents: { name: string; phone: string | null }[] }
type Link = { id: string; parentName: string; email: string; studentName: string; phone: string | null }

export default function ApoderadosPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ studentId: "", name: "", email: "", password: "", phone: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function load() {
    const [s, l] = await Promise.all([fetch("/api/alumnos").then(r => r.json()), fetch("/api/apoderados").then(r => r.json())])
    setStudents(s); setLinks(l)
  }
  useEffect(() => { load() }, [])

  function openNew() {
    setForm({ studentId: "", name: "", email: "", password: "", phone: "" }); setError(""); setModal(true)
  }

  function onStudent(id: string) {
    const s = students.find(x => x.id === id)
    const p = s?.parents[0]
    setForm(f => ({ ...f, studentId: id, name: p?.name ?? "", phone: p?.phone ?? "" }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("")
    const res = await fetch("/api/apoderados", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error ?? "Error"); return }
    await load(); setModal(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{links.length} apoderados con acceso al portal familiar</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600">+ Crear cuenta</button>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface)" }}>
              {["Apoderado", "Correo (usuario)", "Alumno", "Teléfono"].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {links.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-sm" style={{ color: "var(--muted)" }}>Aún no hay cuentas de apoderados creadas</td></tr>}
            {links.map(l => (
              <tr key={l.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3 font-medium" style={{ color: "var(--fg)" }}>{l.parentName}</td>
                <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{l.email}</td>
                <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{l.studentName}</td>
                <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{l.phone ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-xl" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--fg)" }}>Crear cuenta de apoderado</h2>
            <form onSubmit={save} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Alumno (hijo/a) *</label>
                <select required value={form.studentId} onChange={e => onStudent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                  <option value="">Seleccionar...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>)}
                </select>
              </div>
              <Fld label="Nombre del apoderado *" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
              <Fld label="Correo (será su usuario) *" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} required />
              <Fld label="Contraseña *" type="password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} required />
              <Fld label="Teléfono" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">{saving ? "Creando..." : "Crear cuenta"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Fld({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>{label}</label>
      <input type={type} value={value} required={required} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
        style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
    </div>
  )
}
