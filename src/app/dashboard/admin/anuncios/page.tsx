"use client"

import { useState, useEffect } from "react"

type Announcement = { id: string; title: string; content: string; published: boolean; createdAt: string }

export default function AnunciosPage() {
  const [items, setItems] = useState<Announcement[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ title: "", content: "" })
  const [saving, setSaving] = useState(false)

  async function load() {
    const data = await fetch("/api/anuncios").then(r => r.json()).catch(() => [])
    setItems(Array.isArray(data) ? data : [])
  }

  useEffect(() => { load() }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    await fetch("/api/anuncios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    await load(); setModal(false); setForm({ title: "", content: "" }); setSaving(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setModal(true)} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600">
          + Nuevo anuncio
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="rounded-xl border p-8 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--muted)" }}>Sin anuncios publicados</p>
          </div>
        )}
        {items.map(a => (
          <div key={a.id} className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-start justify-between">
              <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>{a.title}</p>
              <span className="text-xs" style={{ color: "var(--muted)" }}>{new Date(a.createdAt).toLocaleDateString("es-PE")}</span>
            </div>
            <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>{a.content}</p>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-xl" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--fg)" }}>Nuevo anuncio</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Título *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Contenido *</label>
                <textarea required rows={4} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">
                  {saving ? "Publicando..." : "Publicar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
