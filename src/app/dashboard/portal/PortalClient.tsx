"use client"

import { useState, useEffect } from "react"

type Daily = { date: string; status: string; entryAt: string | null; exitAt: string | null }
type Child = {
  studentId: string; studentName: string; level: string; section: string
  grades: { course: string; competencia: string; period: string; score: number | null; level: string; display: string }[]
  attendance: { present: number; late: number; absent: number; total: number }
  attendanceDaily: Daily[]
  conducta: { id: string; type: string; title: string | null; description: string; severity: string; code: string | null; points: number | null; date: string }[]
  conductScore: number
  conductBimestre: string
  payments: { month: number; year: number; amount: number; status: string; paid: number }[]
}
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function hora(d: string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
}

export default function PortalClient() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"notas" | "conducta" | "asistencia" | "pagos">("notas")
  const [childIdx, setChildIdx] = useState(0)

  useEffect(() => {
    fetch("/api/portal").then(r => r.json()).then(d => { setChildren(d.children ?? []); setLoading(false) })
  }, [])

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8"><p className="text-sm" style={{ color: "var(--muted)" }}>Cargando...</p></div>
  if (children.length === 0) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="rounded-xl border p-8 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <p className="text-sm" style={{ color: "var(--muted)" }}>Tu cuenta aún no está vinculada a ningún alumno. Contacta a la dirección.</p>
      </div>
    </div>
  )

  const c = children[childIdx]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* selector de hijo */}
      {children.length > 1 && (
        <div className="flex gap-2 mb-4">
          {children.map((ch, i) => (
            <button key={ch.studentId} onClick={() => setChildIdx(i)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${i === childIdx ? "bg-primary-500 text-white" : "border"}`} style={i === childIdx ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>{ch.studentName.split(" ")[0]}</button>
          ))}
        </div>
      )}

      <div className="rounded-xl border p-5 mb-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <p className="text-lg font-bold" style={{ color: "var(--fg)" }}>{c.studentName}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{c.level} · {c.section}</p>
      </div>

      {/* tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto">
        {[{ k: "notas", l: "📊 Notas" }, { k: "conducta", l: "📋 Conducta" }, { k: "asistencia", l: "📅 Asistencia" }, { k: "pagos", l: "💳 Pagos" }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as typeof tab)} className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${tab === t.k ? "bg-primary-500 text-white" : "border"}`} style={tab === t.k ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>{t.l}</button>
        ))}
      </div>

      {/* NOTAS */}
      {tab === "notas" && (
        <>
        <a href={`/dashboard/academico/actividades/${c.studentId}`} className="block mb-3 rounded-xl border p-4 hover:border-primary-400 transition-colors" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold text-primary-500">Ver Registro de Actividades →</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Notas numéricas (0–20) de cada evaluación registrada por los docentes</p>
        </a>
        <a href={`/dashboard/academico/informe/${c.studentId}`} className="block mb-4 rounded-xl border p-4 hover:border-primary-400 transition-colors" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold text-primary-500">Ver Informe de Progreso completo →</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Notas por competencia (AD/A/B/C), asistencia y conducta del bimestre</p>
        </a>
        {c.grades.length === 0 ? <Empty text="Sin notas registradas aún" /> : (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead><tr style={{ background: "var(--surface)" }}>{["Área / Competencia", "Bimestre", "Nota"].map(h => <th key={h} className="text-left px-4 py-2 font-semibold text-xs uppercase" style={{ color: "var(--muted)" }}>{h}</th>)}</tr></thead>
              <tbody>
                {c.grades.map((g, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-2" style={{ color: "var(--fg)" }}>
                      {g.course}
                      <span className="block text-xs" style={{ color: "var(--muted)" }}>{g.competencia}</span>
                    </td>
                    <td className="px-4 py-2 text-xs" style={{ color: "var(--muted)" }}>{g.period}</td>
                    <td className="px-4 py-2 text-right font-bold text-primary-500 whitespace-nowrap">{g.display}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </>
      )}

      {/* CONDUCTA */}
      {tab === "conducta" && (
        <>
          <div className="rounded-xl border p-4 mb-4 flex items-center justify-between" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Puntaje de conducta · {c.conductBimestre}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>Todos parten de 20 puntos; se descuenta por cada falta con código.</p>
            </div>
            <span className="text-xl font-bold px-3 py-1.5 rounded-full" style={{
              background: c.conductScore >= 17 ? "#DCFCE7" : c.conductScore >= 12 ? "#FEF3C7" : "#FEE2E2",
              color: c.conductScore >= 17 ? "#16A34A" : c.conductScore >= 12 ? "#B45309" : "#DC2626",
            }}>{c.conductScore}/20</span>
          </div>
          {c.conducta.length === 0 ? <Empty text="Sin incidencias ni reconocimientos" /> : (
            <div className="space-y-2">
              {c.conducta.map(i => (
                <div key={i.id} className="rounded-xl border p-3 flex items-start gap-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${i.type === "positive" ? "bg-green-500" : i.severity === "muy_grave" ? "bg-red-600" : i.severity === "grave" ? "bg-orange-500" : "bg-amber-500"}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${i.type === "positive" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{i.type === "positive" ? "Reconocimiento" : "Incidencia"}</span>
                      {i.code && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{i.code}</span>}
                      {i.points != null && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700">{i.points} pts</span>}
                      {i.title && <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>{i.title}</span>}
                    </div>
                    <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{i.description}</p>
                    <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>{new Date(i.date).toLocaleDateString("es-PE", { day: "numeric", month: "long" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ASISTENCIA */}
      {tab === "asistencia" && (
        <>
          <div className="grid grid-cols-4 gap-3 mb-4">
            <Mini label="Presente" value={c.attendance.present} color="text-green-600" />
            <Mini label="Tarde" value={c.attendance.late} color="text-amber-600" />
            <Mini label="Ausente" value={c.attendance.absent} color="text-red-600" />
            <Mini label="% Asist." value={c.attendance.total ? `${Math.round(((c.attendance.present + c.attendance.late) / c.attendance.total) * 100)}%` : "—"} color="text-primary-600" />
          </div>
          {c.attendanceDaily.length === 0 ? <Empty text="Sin registros de asistencia este mes" /> : (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full text-sm">
                <thead><tr style={{ background: "var(--surface)" }}>{["Fecha", "Estado", "Ingreso", "Salida"].map(h => <th key={h} className="text-left px-4 py-2 font-semibold text-xs uppercase" style={{ color: "var(--muted)" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {c.attendanceDaily.map((d, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-2" style={{ color: "var(--fg)" }}>{new Date(d.date).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })}</td>
                      <td className="px-4 py-2">{d.status === "present" ? <span className="text-green-600 text-xs font-medium">Presente</span> : d.status === "late" ? <span className="text-amber-600 text-xs font-medium">Tarde</span> : <span className="text-red-600 text-xs font-medium">Ausente</span>}</td>
                      <td className="px-4 py-2" style={{ color: "var(--muted)" }}>{hora(d.entryAt)}</td>
                      <td className="px-4 py-2" style={{ color: "var(--muted)" }}>{hora(d.exitAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* PAGOS */}
      {tab === "pagos" && (
        c.payments.length === 0 ? <Empty text="Sin pensiones registradas" /> : (
          <div className="flex flex-wrap gap-2">
            {c.payments.map((p, i) => {
              const paid = p.status === "paid"
              return (
                <div key={i} className={`px-3 py-2 rounded-lg text-xs font-medium ${paid ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                  {MESES[(p.month ?? 1) - 1]} {p.year}<br /><span className="font-bold">{paid ? "Pagado" : `S/ ${(p.amount - p.paid).toFixed(0)} pend.`}</span>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border p-8 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><p className="text-sm" style={{ color: "var(--muted)" }}>{text}</p></div>
}
function Mini({ label, value, color }: { label: string; value: string | number; color: string }) {
  return <div className="rounded-lg border p-2 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}><p className={`text-lg font-bold ${color}`}>{value}</p><p className="text-[10px]" style={{ color: "var(--muted)" }}>{label}</p></div>
}
