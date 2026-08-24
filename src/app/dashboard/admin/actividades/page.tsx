"use client"

import { useState, useEffect, useRef } from "react"

type Actividad = {
  id: string; title: string; description: string | null
  imageUrl: string | null; category: string; date: string | null
  published: boolean; createdAt: string
}

const CATS = [
  { value: "academica",  label: "Académica",  color: "#1A33CC", bg: "#EEF2FF" },
  { value: "deportiva",  label: "Deportiva",  color: "#16A34A", bg: "#DCFCE7" },
  { value: "cultural",   label: "Cultural",   color: "#9333EA", bg: "#F3E8FF" },
  { value: "religiosa",  label: "Religiosa",  color: "#F0C800", bg: "#FEFCE8" },
]

const empty = { title: "", description: "", imageUrl: "", category: "academica", date: "", published: false }

export default function ActividadesAdminPage() {
  const [items, setItems] = useState<Actividad[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Actividad | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    const r = await fetch("/api/actividades").catch(() => null)
    const data = r ? await r.json().catch(() => []) : []
    setItems(Array.isArray(data) ? data : [])
  }

  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm(empty); setModal(true) }
  function openEdit(a: Actividad) {
    setEditing(a)
    setForm({ title: a.title, description: a.description ?? "", imageUrl: a.imageUrl ?? "", category: a.category, date: a.date ? a.date.slice(0, 10) : "", published: a.published })
    setModal(true)
  }
  function closeModal() { setModal(false); setEditing(null); setForm(empty) }

  async function uploadImage(file: File) {
    setUploading(true)
    const fd = new FormData(); fd.append("file", file)
    const r = await fetch("/api/upload/imagen", { method: "POST", body: fd })
    const data = await r.json()
    if (data.url) setForm(f => ({ ...f, imageUrl: data.url }))
    setUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const method = editing ? "PUT" : "POST"
    const url = editing ? `/api/actividades/${editing.id}` : "/api/actividades"
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    await load(); closeModal(); setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta actividad?")) return
    setDeleting(id)
    await fetch(`/api/actividades/${id}`, { method: "DELETE" })
    await load(); setDeleting(null)
  }

  function catInfo(cat: string) { return CATS.find(c => c.value === cat) ?? CATS[0] }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={openNew} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--primary, #1A33CC)" }}>
          + Nueva actividad
        </button>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATS.map(c => (
          <span key={c.value} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: c.bg, color: c.color }}>
            {c.label}: {items.filter(i => i.category === c.value).length}
          </span>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-semibold mb-1" style={{ color: "var(--fg)" }}>Sin actividades publicadas</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Crea tu primera actividad para que aparezca en la página del colegio</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {items.map(a => {
            const cat = catInfo(a.category)
            return (
              <div key={a.id} className="rounded-xl border overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                {a.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.imageUrl} alt="" className="w-full h-36 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.color }}>{cat.label}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {a.published ? "Publicado" : "Borrador"}
                    </span>
                    {a.date && <span className="text-xs ml-auto" style={{ color: "var(--muted)" }}>{new Date(a.date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}</span>}
                  </div>
                  <p className="font-semibold text-sm mb-1" style={{ color: "var(--fg)" }}>{a.title}</p>
                  {a.description && <p className="text-xs line-clamp-2" style={{ color: "var(--muted)" }}>{a.description}</p>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => openEdit(a)} className="px-3 py-1.5 rounded-lg border text-xs font-medium flex-1" style={{ borderColor: "var(--border)", color: "var(--fg)" }}>Editar</button>
                    <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id} className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-40" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                      {deleting === a.id ? "..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-base font-bold" style={{ color: "var(--fg)" }}>{editing ? "Editar actividad" : "Nueva actividad"}</h2>
              <button onClick={closeModal} className="text-xl leading-none" style={{ color: "var(--muted)" }}>×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Image drop zone */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--fg)" }}>Foto de la actividad</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) uploadImage(f) }}
                  className="relative rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden"
                  style={{ borderColor: dragOver ? "#1A33CC" : "var(--border)", minHeight: 120 }}
                >
                  {form.imageUrl ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.imageUrl} alt="" className="w-full h-40 object-cover" />
                      <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium">Cambiar imagen</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      {uploading
                        ? <><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span className="text-xs" style={{ color: "var(--muted)" }}>Subiendo...</span></>
                        : <><span className="text-3xl">📸</span><span className="text-sm font-medium" style={{ color: "var(--muted)" }}>Arrastra una foto o haz clic para seleccionar</span><span className="text-xs" style={{ color: "var(--muted)" }}>JPG, PNG, WEBP · máx. 5 MB</span></>
                      }
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f) }} />
                {form.imageUrl && (
                  <button type="button" onClick={() => setForm(f => ({ ...f, imageUrl: "" }))} className="mt-1 text-xs" style={{ color: "var(--muted)" }}>✕ Quitar imagen</button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--fg)" }}>Título *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ej. Campeonato interescolar de fútbol"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }} />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--fg)" }}>Descripción</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Breve descripción de la actividad..."
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--fg)" }}>Categoría</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}>
                    {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--fg)" }}>Fecha</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }} />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className={`relative w-10 h-6 rounded-full transition-colors ${form.published ? "bg-green-500" : "bg-gray-300"}`}
                  onClick={() => setForm(f => ({ ...f, published: !f.published }))}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.published ? "left-5" : "left-1"}`} />
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>
                  {form.published ? "Publicado (visible en la web)" : "Borrador (no visible)"}
                </span>
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Cancelar</button>
                <button type="submit" disabled={saving || uploading} className="px-5 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60" style={{ background: "var(--primary, #1A33CC)" }}>
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear actividad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
