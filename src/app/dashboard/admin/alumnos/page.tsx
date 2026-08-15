"use client"

import { useState, useEffect } from "react"
import ImportarAlumnos from "./ImportarAlumnos"

type Parent = { name: string; phone: string | null; monthlyFee: number | null }
type Enrollment = { section: { id: string; name: string; grade: { name: string; level: { name: string } } } }
type Student = {
  id: string
  firstName: string
  lastName: string
  dni: string | null
  gender: string | null
  active: boolean
  enrollments: Enrollment[]
  parents: Parent[]
}
type Grade = { id: string; name: string; level: { name: string }; sections: { id: string; name: string }[] }

const EMPTY = { firstName: "", lastName: "", dni: "", birthDate: "", gender: "", sectionId: "", guardianName: "", guardianPhone: "", monthlyFee: "" }

export default function AlumnosPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  async function load() {
    const [s, g] = await Promise.all([fetch("/api/alumnos").then(r => r.json()), fetch("/api/grados").then(r => r.json())])
    setStudents(s)
    setGrades(g)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditing(null)
    setForm(EMPTY)
    setModal(true)
  }

  function openEdit(s: Student) {
    setEditing(s)
    setForm({
      firstName: s.firstName,
      lastName: s.lastName,
      dni: s.dni ?? "",
      birthDate: "",
      gender: s.gender ?? "",
      sectionId: s.enrollments[0]?.section?.id ?? "",
      guardianName: s.parents[0]?.name ?? "",
      guardianPhone: s.parents[0]?.phone ?? "",
      monthlyFee: s.parents[0]?.monthlyFee != null ? String(s.parents[0].monthlyFee) : "",
    })
    setModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const url = editing ? `/api/alumnos/${editing.id}` : "/api/alumnos"
    const method = editing ? "PUT" : "POST"
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    await load()
    setModal(false)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar alumno?")) return
    await fetch(`/api/alumnos/${id}`, { method: "DELETE" })
    await load()
  }

  const filtered = students.filter(s =>
    `${s.firstName} ${s.lastName} ${s.dni ?? ""}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Alumnos</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{students.length} estudiantes matriculados</p>
        </div>
        <div className="flex gap-2">
          <ImportarAlumnos onDone={load} />
          <button onClick={openNew} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors">
            + Nuevo alumno
          </button>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar por nombre o DNI..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}
      />

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface)" }}>
              {["Apellidos y nombres", "DNI", "Grado/Sección", "Apoderado", "Teléfono", ""].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>Sin alumnos registrados</td></tr>
            )}
            {filtered.map((s, i) => {
              const enroll = s.enrollments[0]
              const section = enroll ? `${enroll.section.grade.name} "${enroll.section.name}"` : "—"
              const parent = s.parents[0]
              return (
                <tr key={s.id} className="border-t transition-colors hover:bg-primary-50/30" style={{ borderColor: "var(--border)" }}>
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--fg)" }}>
                    {s.lastName}, {s.firstName}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{s.dni ?? "—"}</td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{section}</td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{parent?.name ?? "—"}</td>
                  <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{parent?.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} className="text-xs px-2 py-1 rounded border hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300 transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Editar</button>
                      <button onClick={() => handleDelete(s.id)} className="text-xs px-2 py-1 rounded border hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl border p-6 shadow-xl overflow-y-auto max-h-[90vh]" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--fg)" }}>{editing ? "Editar alumno" : "Nuevo alumno"}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombres *" value={form.firstName} onChange={v => setForm(f => ({ ...f, firstName: v }))} required />
                <Field label="Apellidos *" value={form.lastName} onChange={v => setForm(f => ({ ...f, lastName: v }))} required />
                <Field label="DNI" value={form.dni} onChange={v => setForm(f => ({ ...f, dni: v }))} />
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Género</label>
                  <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                    <option value="">—</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <Field label="Fecha de nacimiento" type="date" value={form.birthDate} onChange={v => setForm(f => ({ ...f, birthDate: v }))} />
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Grado / Salón</label>
                  <select value={form.sectionId} onChange={e => setForm(f => ({ ...f, sectionId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                    <option value="">Sin asignar</option>
                    {grades.map(g => g.sections.map(sec => (
                      <option key={sec.id} value={sec.id}>{g.level.name} — {g.name} "{sec.name}"</option>
                    )))}
                  </select>
                </div>
              </div>

              <p className="text-xs font-semibold uppercase tracking-wider pt-2" style={{ color: "var(--muted)" }}>Apoderado</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre apoderado" value={form.guardianName} onChange={v => setForm(f => ({ ...f, guardianName: v }))} />
                <Field label="Teléfono" value={form.guardianPhone} onChange={v => setForm(f => ({ ...f, guardianPhone: v }))} />
                <Field label="Pensión mensual (S/)" type="number" value={form.monthlyFee} onChange={v => setForm(f => ({ ...f, monthlyFee: v }))} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">
                  {saving ? "Guardando..." : editing ? "Actualizar" : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, required, type = "text" }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>{label}</label>
      <input type={type} required={required} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
        style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
    </div>
  )
}
