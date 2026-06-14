"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import BackButton from "@/components/BackButton"

type Resource = {
  id: string; title: string; author: string | null; genre: string | null
  level: string | null; grade: string | null; externalUrl: string | null; approved: boolean
  fileUrl: string | null; fileName: string | null; fileType: string | null
}

const EMPTY = { title: "", author: "", genre: "", level: "", grade: "", externalUrl: "", approved: true }

export default function BibliotecaPage() {
  const { data: session } = useSession()
  const isParent = session?.user?.role === "padre"
  const [items, setItems] = useState<Resource[]>([])
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Resource | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() { setItems(await fetch("/api/biblioteca").then(r => r.json())) }
  useEffect(() => { load() }, [])

  function openNew() { setEditing(null); setForm(EMPTY); setFile(null); setModal(true) }
  function openEdit(r: Resource) {
    setEditing(r); setFile(null)
    setForm({ title: r.title, author: r.author ?? "", genre: r.genre ?? "", level: r.level ?? "", grade: r.grade ?? "", externalUrl: r.externalUrl ?? "", approved: r.approved })
    setModal(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    let resourceId = editing?.id
    if (editing) {
      await fetch(`/api/biblioteca/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
    } else {
      const created = await fetch("/api/biblioteca", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }).then(r => r.json())
      resourceId = created.id
    }
    if (file && resourceId) {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("resourceId", resourceId)
      await fetch("/api/biblioteca/upload", { method: "POST", body: fd })
    }
    await load(); setModal(false); setSaving(false)
  }

  async function remove(id: string) {
    if (!confirm("¿Quitar del catálogo?")) return
    await fetch(`/api/biblioteca/${id}`, { method: "DELETE" }); await load()
  }

  const filtered = items.filter(r => `${r.title} ${r.author ?? ""} ${r.genre ?? ""} ${r.grade ?? ""}`.toLowerCase().includes(filter.toLowerCase()))
  const enPlan = items.filter(r => r.approved)

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <BackButton href="/dashboard" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Biblioteca</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{items.length} recursos · {enPlan.length} en plan lector</p>
        </div>
        {!isParent && <button onClick={openNew} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600">+ Agregar libro</button>}
      </div>

      <input type="text" placeholder="Buscar por título, autor, género o grado..." value={filter} onChange={e => setFilter(e.target.value)}
        className="w-full mb-4 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && <p className="col-span-full text-center py-10 text-sm" style={{ color: "var(--muted)" }}>Sin recursos en el catálogo</p>}
        {filtered.map(r => (
          <div key={r.id} className="rounded-xl border p-4 flex flex-col" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>{r.title}</p>
              {r.approved && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-100 text-gold-600 font-medium whitespace-nowrap">Plan lector</span>}
            </div>
            {r.author && <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>por {r.author}</p>}
            <div className="flex flex-wrap gap-1 mt-2">
              {r.genre && <span className="text-[10px] px-2 py-0.5 rounded bg-sky-50 text-sky-600">{r.genre}</span>}
              {r.grade && <span className="text-[10px] px-2 py-0.5 rounded bg-primary-50 text-primary-600">{r.grade}</span>}
              {r.fileName && <span className="text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-600">📄 {r.fileType?.includes("pdf") ? "PDF" : "Word"}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
              {r.fileUrl && <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded bg-primary-500 text-white hover:bg-primary-600">Ver</a>}
              {r.fileUrl && <a href={r.fileUrl} download={r.fileName ?? true} className="text-xs px-2 py-1 rounded border hover:bg-primary-50 transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Descargar</a>}
              {r.externalUrl && <a href={r.externalUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded bg-sky-500 text-white hover:bg-sky-600">Enlace</a>}
              {!isParent && <button onClick={() => openEdit(r)} className="text-xs px-2 py-1 rounded border hover:bg-primary-50 transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Editar</button>}
              {!isParent && <button onClick={() => remove(r.id)} className="text-xs px-2 py-1 rounded border hover:bg-red-50 hover:text-red-600 transition-colors ml-auto" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Quitar</button>}
            </div>
          </div>
        ))}
      </div>

      {modal && !isParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border p-6 shadow-xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--fg)" }}>{editing ? "Editar recurso" : "Nuevo recurso"}</h2>
            <form onSubmit={save} className="space-y-3">
              <Fld label="Título *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} required />
              <div className="grid grid-cols-2 gap-3">
                <Fld label="Autor" value={form.author} onChange={v => setForm(f => ({ ...f, author: v }))} />
                <Fld label="Género" value={form.genre} onChange={v => setForm(f => ({ ...f, genre: v }))} />
                <Fld label="Nivel" value={form.level} onChange={v => setForm(f => ({ ...f, level: v }))} placeholder="Primaria" />
                <Fld label="Grado" value={form.grade} onChange={v => setForm(f => ({ ...f, grade: v }))} placeholder="3° Grado" />
              </div>
              <Fld label="Enlace externo (opcional)" value={form.externalUrl} onChange={v => setForm(f => ({ ...f, externalUrl: v }))} placeholder="https://..." />
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Archivo PDF o Word {editing?.fileName && <span className="text-green-600">(actual: {editing.fileName})</span>}</label>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm" style={{ color: "var(--fg)" }} />
                {file && <p className="text-xs mt-1 text-green-600">Seleccionado: {file.name}</p>}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.approved} onChange={e => setForm(f => ({ ...f, approved: e.target.checked }))} />
                <span className="text-sm" style={{ color: "var(--fg)" }}>Incluir en el plan lector</span>
              </label>
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

function Fld({ label, value, onChange, required, placeholder }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>{label}</label>
      <input value={value} required={required} placeholder={placeholder} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
        style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
    </div>
  )
}
