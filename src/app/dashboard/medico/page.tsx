"use client"

import { useState, useEffect, useCallback } from "react"
import BackButton from "@/components/BackButton"

type Row = { id: string; name: string; level: string; aula: string; hasRecord: boolean; bloodType: string | null; hasAllergy: boolean }

export default function MedicoPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [search, setSearch] = useState("")
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState("")

  const load = useCallback(async () => { setRows(await fetch("/api/medico/lista").then(r => r.json())) }, [])
  useEffect(() => { load() }, [load])

  async function openEdit(r: Row) {
    setEditId(r.id); setEditName(r.name)
    const h = await fetch(`/api/medico?studentId=${r.id}`).then(res => res.json())
    setForm({
      weight: h.weight != null ? String(h.weight) : "", height: h.height != null ? String(h.height) : "",
      bloodType: h.bloodType ?? "", allergies: h.allergies ?? "", medications: h.medications ?? "", conditions: h.conditions ?? "", insurance: h.insurance ?? "",
    })
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch("/api/medico", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: editId, ...form }) })
    setSaving(false); setToast("Ficha guardada ✓"); setTimeout(() => setToast(""), 2000)
    setEditId(null); await load()
  }

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  const filtered = rows.filter(r => `${r.name} ${r.aula} ${r.level}`.toLowerCase().includes(search.toLowerCase()))
  const byLevel: Record<string, Row[]> = {}
  for (const r of filtered) { (byLevel[r.level] ??= []).push(r) }
  const conFicha = rows.filter(r => r.hasRecord).length

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {toast && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium shadow-lg">{toast}</div>}
      <BackButton href="/dashboard" />
      <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>{conFicha} de {rows.length} alumnos con ficha registrada</p>

      <input type="text" placeholder="Buscar alumno o aula..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }} />

      {Object.entries(byLevel).map(([lvl, list]) => (
        <div key={lvl} className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>{lvl}</h2>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--surface)" }}>
                  {["Alumno", "Aula", "Sangre", "Ficha", ""].map(h => <th key={h} className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {list.map(r => (
                  <tr key={r.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-2.5 font-medium" style={{ color: "var(--fg)" }}>
                      {r.name}
                      {r.hasAllergy && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">Alergia</span>}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "var(--muted)" }}>{r.aula}</td>
                    <td className="px-4 py-2.5">
                      {r.bloodType
                        ? <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700" style={{ fontVariantNumeric: "tabular-nums" }}>{r.bloodType}</span>
                        : <span style={{ color: "var(--muted)" }}>—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {r.hasRecord ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Completa</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">Pendiente</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => openEdit(r)} className="text-xs px-3 py-1 rounded border hover:bg-primary-50 hover:text-primary-600 transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{r.hasRecord ? "Editar" : "Llenar"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl border p-6 shadow-xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <form onSubmit={save} className="space-y-3">
              {/* Acciones arriba: la ficha desborda en celular. */}
              <div className="sticky -top-6 z-10 flex items-start justify-between gap-3 -mx-6 px-6 pt-6 pb-3 -mt-6" style={{ background: "var(--bg)" }}>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold" style={{ color: "var(--fg)" }}>Ficha médica</h2>
                  <p className="text-sm truncate" style={{ color: "var(--muted)" }}>{editName}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => setEditId(null)} className="px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Cancelar</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">{saving ? "Guardando..." : "Guardar ficha"}</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <F label="Peso (kg)" type="number" value={form.weight ?? ""} onChange={v => set("weight", v)} />
                <F label="Talla (cm)" type="number" value={form.height ?? ""} onChange={v => set("height", v)} />
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Sangre</label>
                  <select value={form.bloodType ?? ""} onChange={e => set("bloodType", e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                    <option value="">—</option>
                    {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {/* La etiqueta refleja la pregunta que respondieron los apoderados en el
                  registro, porque varias respuestas son condiciones y no alergias. */}
              <FT label="Alergias o condiciones médicas importantes" value={form.allergies ?? ""} onChange={v => set("allergies", v)} />
              <FT label="Medicación habitual" value={form.medications ?? ""} onChange={v => set("medications", v)} />
              <FT label="Condiciones / antecedentes" value={form.conditions ?? ""} onChange={v => set("conditions", v)} />
              <F label="Seguro / EsSalud / SIS" value={form.insurance ?? ""} onChange={v => set("insurance", v)} />
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function F({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
    </div>
  )
}
function FT({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>{label}</label>
      <textarea rows={2} value={value} onChange={e => onChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
    </div>
  )
}
