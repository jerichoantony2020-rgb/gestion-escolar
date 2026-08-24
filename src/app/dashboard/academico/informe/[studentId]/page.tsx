"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"

type Competencia = { id: string; name: string; levels: string[] }
type AreaOut = { id: string; name: string; competencias: Competencia[]; nivelPorBimestre: string[] }
type Informe = {
  studentName: string
  nivel: string
  grado: string
  seccion: string
  year: number
  ugel: string
  institutionName: string
  directorName: string
  periods: { id: string; name: string; number: number }[]
  areas: AreaOut[]
  asistencia: { dias: number; justificadas: number; injustificadas: number; inasistencias: number }[]
  comportamiento: { score: number; level: string }[]
  conclusiones: { periodId: string; label: string; text: string }[]
}

const LEVEL_COLOR: Record<string, string> = { AD: "#16a34a", A: "#0ea5e9", B: "#f59e0b", C: "#ef4444" }

export default function InformePage() {
  const params = useParams<{ studentId: string }>()
  const studentId = params.studentId
  const [data, setData] = useState<Informe | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string>("")
  const { data: session } = useSession()
  const canEdit = !!session && session.user.role !== "padre"

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/informe?studentId=${studentId}`)
    if (res.ok) {
      const d: Informe = await res.json()
      setData(d)
      setEditing(Object.fromEntries(d.conclusiones.map(c => [c.periodId, c.text])))
    }
    setLoading(false)
  }, [studentId])

  useEffect(() => { load() }, [load])

  async function saveNote(periodId: string) {
    setSaving(periodId)
    await fetch("/api/informe/nota-tutor", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, periodId, text: editing[periodId] ?? "" }),
    })
    setSaving("")
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-10 text-sm" style={{ color: "var(--muted)" }}>Cargando informe...</div>
  if (!data) return <div className="max-w-5xl mx-auto px-4 py-10 text-sm" style={{ color: "var(--muted)" }}>No se pudo cargar el informe.</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600">
          Imprimir / PDF
        </button>
      </div>

      <div className="rounded-xl border p-6 print:border-0 print:p-0" style={{ borderColor: "var(--border)" }}>
        <div className="text-center mb-4">
          <p className="text-lg font-bold" style={{ color: "var(--fg)" }}>INFORME DE PROGRESO — {data.year}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>UGEL: {data.ugel} · I.E.P: {data.institutionName}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-6">
          <Field label="Nivel" value={data.nivel} />
          <Field label="Grado" value={data.grado} />
          <Field label="Sección" value={data.seccion} />
          <Field label="Apellidos y Nombres" value={data.studentName} />
        </div>

        {data.areas.map(area => (
          <div key={area.id} className="mb-5 print:break-inside-avoid">
            <div className="rounded-t-lg px-3 py-2 text-xs font-bold uppercase tracking-wide" style={{ background: "var(--surface)", color: "var(--fg)" }}>{area.name}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-2 py-1.5 border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Competencia</th>
                    {data.periods.map(p => (
                      <th key={p.id} className="px-2 py-1.5 border text-center" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{p.name.replace(" Bimestre", "")}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {area.competencias.map(c => (
                    <tr key={c.id}>
                      <td className="px-2 py-1.5 border" style={{ borderColor: "var(--border)", color: "var(--fg)" }}>{c.name}</td>
                      {c.levels.map((lv, i) => (
                        <td key={i} className="px-2 py-1.5 border text-center font-semibold" style={{ borderColor: "var(--border)", color: lv ? LEVEL_COLOR[lv] : "var(--muted)" }}>{lv || "—"}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="px-2 py-1.5 border font-bold" style={{ borderColor: "var(--border)", color: "var(--fg)" }}>NIVEL DE LOGRO</td>
                    {area.nivelPorBimestre.map((lv, i) => (
                      <td key={i} className="px-2 py-1.5 border text-center font-bold" style={{ borderColor: "var(--border)", background: "var(--surface)", color: lv ? LEVEL_COLOR[lv] : "var(--muted)" }}>{lv || "—"}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* Asistencia */}
        <div className="mb-5 print:break-inside-avoid">
          <div className="rounded-t-lg px-3 py-2 text-xs font-bold uppercase tracking-wide" style={{ background: "var(--surface)", color: "var(--fg)" }}>Resumen de Asistencia</div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left px-2 py-1.5 border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}></th>
                {data.periods.map(p => <th key={p.id} className="px-2 py-1.5 border text-center" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{p.name.replace(" Bimestre", "")}</th>)}
              </tr>
            </thead>
            <tbody>
              <Row label="Días de clase" values={data.asistencia.map(a => a.dias)} />
              <Row label="Inasistencias justificadas" values={data.asistencia.map(a => a.justificadas)} />
              <Row label="Inasistencias injustificadas" values={data.asistencia.map(a => a.injustificadas)} />
            </tbody>
          </table>
        </div>

        {/* Comportamiento */}
        <div className="mb-5 print:break-inside-avoid">
          <div className="rounded-t-lg px-3 py-2 text-xs font-bold uppercase tracking-wide" style={{ background: "var(--surface)", color: "var(--fg)" }}>Comportamiento</div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left px-2 py-1.5 border" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Nivel</th>
                {data.periods.map(p => <th key={p.id} className="px-2 py-1.5 border text-center" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{p.name.replace(" Bimestre", "")}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-1.5 border" style={{ borderColor: "var(--border)", color: "var(--fg)" }}>Conducta (puntaje/20)</td>
                {data.comportamiento.map((c, i) => (
                  <td key={i} className="px-2 py-1.5 border text-center font-bold" style={{ borderColor: "var(--border)", color: LEVEL_COLOR[c.level] }}>{c.level} ({c.score})</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Conclusión descriptiva */}
        <div className="mb-5 print:break-inside-avoid">
          <div className="rounded-t-lg px-3 py-2 text-xs font-bold uppercase tracking-wide" style={{ background: "var(--surface)", color: "var(--fg)" }}>Conclusión Descriptiva</div>
          <div className="space-y-2 pt-2">
            {data.periods.map(p => (
              <div key={p.id} className="flex gap-2 items-start">
                <span className="text-xs font-semibold w-8 pt-2" style={{ color: "var(--muted)" }}>{p.name.replace(" Bimestre", "")}</span>
                {canEdit ? (
                  <div className="flex-1 flex gap-2">
                    <textarea
                      value={editing[p.id] ?? ""}
                      onChange={e => setEditing(ed => ({ ...ed, [p.id]: e.target.value }))}
                      rows={2}
                      className="flex-1 px-2 py-1.5 rounded border text-xs outline-none focus:ring-2 focus:ring-primary-500 print:hidden"
                      style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}
                    />
                    <button onClick={() => saveNote(p.id)} disabled={saving === p.id} className="print:hidden px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60">
                      {saving === p.id ? "..." : "Guardar"}
                    </button>
                    <p className="hidden print:block text-xs flex-1" style={{ color: "var(--fg)" }}>{editing[p.id] || "—"}</p>
                  </div>
                ) : (
                  <p className="flex-1 text-xs pt-2" style={{ color: "var(--fg)" }}>{editing[p.id] || "—"}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Firmas */}
        <div className="grid grid-cols-2 gap-8 mt-10 text-center text-xs">
          <div>
            <div className="border-t pt-1" style={{ borderColor: "var(--fg)" }}>FIRMA TUTOR(A)</div>
          </div>
          <div>
            <div className="border-t pt-1" style={{ borderColor: "var(--fg)" }}>{data.directorName || "FIRMA Y SELLO DE DIRECCIÓN"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{label}</p>
      <p className="font-medium" style={{ color: "var(--fg)" }}>{value || "—"}</p>
    </div>
  )
}

function Row({ label, values }: { label: string; values: number[] }) {
  return (
    <tr>
      <td className="px-2 py-1.5 border" style={{ borderColor: "var(--border)", color: "var(--fg)" }}>{label}</td>
      {values.map((v, i) => <td key={i} className="px-2 py-1.5 border text-center" style={{ borderColor: "var(--border)", color: "var(--fg)" }}>{v}</td>)}
    </tr>
  )
}
