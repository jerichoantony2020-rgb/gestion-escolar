"use client"

import { useState, useEffect } from "react"

type Competencia = { id: string; name: string; courseId: string | null; courseLabel: string | null }
type Area = { id: string; name: string; competencias: Competencia[] }
type LevelData = { id: string; name: string; courses: { id: string; name: string }[]; areas: Area[] }

export default function CompetenciasPage() {
  const [levels, setLevels] = useState<LevelData[]>([])
  const [activeLevel, setActiveLevel] = useState("")
  const [changes, setChanges] = useState<Record<string, string | null>>({})
  const [labelChanges, setLabelChanges] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState("")

  useEffect(() => {
    fetch("/api/admin/competencias").then(r => r.json()).then(d => {
      setLevels(d.levels ?? [])
      if (d.levels?.[0]) setActiveLevel(d.levels[0].id)
      setLoading(false)
    })
  }, [])

  function setCourse(competenciaId: string, courseId: string) {
    setChanges(ch => ({ ...ch, [competenciaId]: courseId || null }))
  }

  async function removeCompetencia(c: Competencia) {
    if (!confirm(`¿Quitar "${c.name}" de la libreta? Se borrará cualquier nota ya registrada para esta competencia.`)) return
    await fetch("/api/admin/competencias", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competenciaId: c.id }),
    })
    setLevels(ls => ls.map(l => ({ ...l, areas: l.areas.map(a => ({ ...a, competencias: a.competencias.filter(x => x.id !== c.id) })) })))
    setToast("Competencia eliminada ✓")
    setTimeout(() => setToast(""), 2500)
  }

  const pendingCount = new Set([...Object.keys(changes), ...Object.keys(labelChanges)]).size

  async function save() {
    const ids = new Set([...Object.keys(changes), ...Object.keys(labelChanges)])
    if (ids.size === 0) return
    const updates = [...ids].map(competenciaId => ({
      competenciaId,
      ...(competenciaId in changes ? { courseId: changes[competenciaId] } : {}),
      ...(competenciaId in labelChanges ? { courseLabel: labelChanges[competenciaId] } : {}),
    }))
    setSaving(true)
    await fetch("/api/admin/competencias", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    })
    setSaving(false)
    setChanges({})
    setLabelChanges({})
    setToast("Cambios guardados ✓")
    setTimeout(() => setToast(""), 2500)
  }

  const level = levels.find(l => l.id === activeLevel)

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-10 text-sm" style={{ color: "var(--muted)" }}>Cargando...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium shadow-lg">{toast}</div>
      )}

      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--fg)" }}>Competencias por Curso</h1>
      <p className="text-sm mb-1" style={{ color: "var(--muted)" }}>
        Cada fila es una competencia MINEDU. El curso que le asignes es el que decide qué docente la califica
        (el que tenga ese curso asignado en su aula, en Admin → Usuarios).
      </p>
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
        El <strong>nombre del curso</strong> es cómo lo llaman el alumno y el apoderado (ej. &quot;Literatura&quot;) y es lo que
        verán en el portal; déjalo vacío si el área no se reparte en cursos. Si alguna fila no debería estar en la
        libreta, quítala con &quot;Eliminar&quot;.
      </p>

      <div className="sticky top-16 z-30 flex justify-end py-2 mb-2" style={{ background: "var(--bg)" }}>
        <button onClick={save} disabled={saving || pendingCount === 0} className="px-5 py-2 rounded-lg bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 disabled:opacity-40 shadow-sm">
          {saving ? "Guardando..." : `Guardar cambios${pendingCount ? ` (${pendingCount})` : ""}`}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {levels.map(l => (
          <button key={l.id} onClick={() => setActiveLevel(l.id)} className={`px-4 py-2 rounded-lg text-sm font-medium ${l.id === activeLevel ? "bg-primary-500 text-white" : "border"}`} style={l.id === activeLevel ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>{l.name}</button>
        ))}
      </div>

      {level?.areas.map(area => (
        <div key={area.id} className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>{area.name}</p>
          <div className="rounded-xl border divide-y overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {area.competencias.map(c => {
              const current = changes[c.id] !== undefined ? changes[c.id] : c.courseId
              return (
                <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap" style={{ background: "var(--bg)" }}>
                  <p className="text-sm flex-1 min-w-[200px]" style={{ color: "var(--fg)" }}>{c.name}</p>
                  <input
                    value={labelChanges[c.id] ?? c.courseLabel ?? ""}
                    onChange={e => setLabelChanges(l => ({ ...l, [c.id]: e.target.value }))}
                    placeholder="Nombre del curso (opcional)"
                    title="Cómo lo llama el alumno y el apoderado. Vacío = se muestra la competencia."
                    className="px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500 w-[190px]"
                    style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}
                  />
                  <select
                    value={current ?? ""}
                    onChange={e => setCourse(c.id, e.target.value)}
                    className="px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500 min-w-[220px]"
                    style={{ background: "var(--surface)", borderColor: current ? "var(--border)" : "#ef4444", color: "var(--fg)" }}
                  >
                    <option value="">— sin curso asignado —</option>
                    {level.courses.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
                  </select>
                  <button onClick={() => removeCompetencia(c)} className="text-xs px-2 py-1.5 rounded-lg border hover:bg-red-50 hover:text-red-600 transition-colors whitespace-nowrap" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Eliminar</button>
                </div>
              )
            })}
          </div>
        </div>
      ))}

    </div>
  )
}
