"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { currentBimestreNumber } from "@/lib/bimestre"

type CompScore = { scores: (number | string)[]; finalScore: number | null }
type Competencia = { id: string; name: string; scores: CompScore[] }
type AreaOut = { id: string; name: string; competencias: Competencia[] }
type Informe = {
  studentName: string
  nivel: string
  grado: string
  seccion: string
  periods: { id: string; name: string; number: number }[]
  areas: AreaOut[]
}

function scoreColor(v: number | null): string {
  if (v == null) return "var(--muted)"
  if (v >= 18) return "#16a34a"
  if (v >= 14) return "#0ea5e9"
  if (v >= 11) return "#f59e0b"
  return "#ef4444"
}

export default function ActividadesPage() {
  const params = useParams<{ studentId: string }>()
  const studentId = params.studentId
  const [data, setData] = useState<Informe | null>(null)
  const [periodId, setPeriodId] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/informe?studentId=${studentId}`).then(r => r.json()).then((d: Informe) => {
      setData(d)
      if (d.periods?.length) {
        const match = d.periods.find(p => p.number === currentBimestreNumber())
        setPeriodId(match?.id ?? d.periods[0].id)
      }
      setLoading(false)
    })
  }, [studentId])

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-10 text-sm" style={{ color: "var(--muted)" }}>Cargando...</div>
  if (!data) return <div className="max-w-4xl mx-auto px-4 py-10 text-sm" style={{ color: "var(--muted)" }}>No se pudo cargar el registro.</div>

  const periodIdx = data.periods.findIndex(p => p.id === periodId)
  const areasWithActivity = data.areas.filter(a => a.competencias.some(c => (c.scores[periodIdx]?.scores.length ?? 0) > 0))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Registro de Actividades</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{data.studentName} · {data.grado} &quot;{data.seccion}&quot; · notas numéricas (0–20) por evaluación</p>
        </div>
        <a href={`/dashboard/academico/informe/${studentId}`} className="text-sm font-semibold text-primary-500 hover:underline whitespace-nowrap">Ver libreta (AD/A/B/C) →</a>
      </div>

      <div className="flex gap-2 my-5 overflow-x-auto">
        {data.periods.map(p => (
          <button key={p.id} onClick={() => setPeriodId(p.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${p.id === periodId ? "bg-primary-500 text-white" : "border"}`} style={p.id === periodId ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>{p.name}</button>
        ))}
      </div>

      {areasWithActivity.length === 0 && (
        <div className="rounded-xl border p-8 text-center text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          Aún no hay evaluaciones registradas en este bimestre.
        </div>
      )}

      {areasWithActivity.map(area => (
        <div key={area.id} className="mb-5">
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>{area.name}</p>
          <div className="rounded-xl border divide-y overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {area.competencias.filter(c => (c.scores[periodIdx]?.scores.length ?? 0) > 0).map(c => {
              const cs = c.scores[periodIdx]
              return (
                <div key={c.id} className="px-4 py-3" style={{ background: "var(--bg)" }}>
                  <p className="text-sm font-medium mb-2" style={{ color: "var(--fg)" }}>{c.name}</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    {cs.scores.map((s, i) => (
                      <span key={i} className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold border" style={{ borderColor: "var(--border)", color: "var(--fg)" }}>{s}</span>
                    ))}
                    <span className="text-xs px-2" style={{ color: "var(--muted)" }}>Promedio:</span>
                    <span className="text-base font-bold" style={{ color: scoreColor(cs.finalScore) }}>{cs.finalScore ?? "—"}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
