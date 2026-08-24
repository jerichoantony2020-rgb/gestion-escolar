"use client"

import { useState, useEffect, useRef } from "react"

type Noticia = {
  id: string; title: string; content: string
  imageUrl: string | null; published: boolean; createdAt: string
}

const empty = { title: "", content: "", imageUrl: "", published: false }

export default function NoticiasAdminPage() {
  const [items, setItems] = useState<Noticia[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Noticia | null>(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    const r = await fetch("/api/noticias").catch(() => null)
    const data = r ? await r.json().catch(() => []) : []
    // admin needs all, not just published — fetch all via separate endpoint or just show published for now
    setItems(Array.isArray(data) ? data : [])
  }

  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm(empty); setModal(true) }
  function openEdit(n: Noticia) { setEditing(n); setForm({ title: n.title, content: n.content, imageUrl: n.imageUrl ?? "", published: n.published }); setModal(true) }
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
    const url = editing ? `/api/noticias/${editing.id}` : "/api/noticias"
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    await load(); closeModal(); setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta noticia?")) return
    setDeleting(id)
    await fetch(`/api/noticias/${id}`, { method: "DELETE" })
    await load(); setDeleting(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={openNew} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: "var(--primary, #1A33CC)" }}>
          + Nueva noticia
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-4xl mb-3">📰</p>
          <p className="font-semibold mb-1" style={{ color: "var(--fg)" }}>Sin noticias publicadas</p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Crea tu primera noticia para que aparezca en la página del colegio</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(n => (
            <div key={n.id} className="rounded-xl border overflow-hidden flex" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              {n.imageUrl && (
                <div className="w-28 flex-shrink-0 bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={n.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 p-4 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${n.published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {n.published ? "Publicado" : "Borrador"}
                      </span>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>{new Date(n.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                    <p className="font-semibold truncate" style={{ color: "var(--fg)" }}>{n.title}</p>
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: "var(--muted)" }}>{n.content}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(n)} className="px-3 py-1.5 rounded-lg border text-xs font-medium" style={{ borderColor: "var(--border)", color: "var(--fg)" }}>Editar</button>
                    <button onClick={() => handleDelete(n.id)} disabled={deleting === n.id} className="px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-40" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                      {deleting === n.id ? "..." : "Eliminar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-base font-bold" style={{ color: "var(--fg)" }}>{editing ? "Editar noticia" : "Nueva noticia"}</h2>
              <button onClick={closeModal} className="text-xl leading-none" style={{ color: "var(--muted)" }}>×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Image drop zone */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "var(--fg)" }}>Imagen de portada</label>
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
                        : <><span className="text-3xl">🖼️</span><span className="text-sm font-medium" style={{ color: "var(--muted)" }}>Arrastra una imagen o haz clic para seleccionar</span><span className="text-xs" style={{ color: "var(--muted)" }}>JPG, PNG, WEBP · máx. 5 MB</span></>
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
                  placeholder="Ej. Semana del Día del Logro 2026"
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }} />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--fg)" }}>Contenido *</label>
                <textarea required rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Describe la noticia..."
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }} />
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
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Publicar noticia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
