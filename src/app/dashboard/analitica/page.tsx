"use client"

import { useState, useEffect } from "react"

type Data = {
  totalStudents: number; totalStaff: number; sections: number
  attendancePct: number | null; attendanceRecords: number
  recaudado: number; totalEsperado: number; pagados: number; morosos: number; morosidadPct: number | null; ordersCount: number
  porGrado: Record<string, number>
  month: number; year: number
}
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

export default function AnaliticaPage() {
  const [d, setD] = useState<Data | null>(null)
  useEffect(() => { fetch("/api/analitica").then(r => r.json()).then(setD) }, [])

  if (!d) return <div className="max-w-5xl mx-auto px-4 py-8"><p className="text-sm" style={{ color: "var(--muted)" }}>Cargando indicadores...</p></div>

  const maxGrado = Math.max(1, ...Object.values(d.porGrado))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Indicadores de {MESES[d.month - 1]} {d.year}</p>

      {/* Generales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <Card icon="👩‍🎓" label="Estudiantes activos" value={String(d.totalStudents)} />
        <Card icon="👩‍🏫" label="Personal docente" value={String(d.totalStaff)} />
        <Card icon="🏫" label="Secciones" value={String(d.sections)} />
      </div>

      {/* Asistencia */}
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Asistencia del mes</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card icon="✅" label="% Asistencia" value={d.attendancePct != null ? `${d.attendancePct}%` : "—"} accent="text-green-600" />
        <Card icon="📋" label="Registros tomados" value={String(d.attendanceRecords)} />
      </div>

      {/* Finanzas */}
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Finanzas del mes</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card icon="💰" label="Recaudado" value={`S/ ${d.recaudado.toFixed(0)}`} accent="text-primary-600" />
        <Card icon="🎯" label="Esperado" value={`S/ ${d.totalEsperado.toFixed(0)}`} />
        <Card icon="✔️" label="Pagados" value={String(d.pagados)} accent="text-green-600" />
        <Card icon="⚠️" label="Morosidad" value={d.morosidadPct != null ? `${d.morosidadPct}%` : "—"} accent="text-red-600" />
      </div>

      {/* Distribución por grado */}
      <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>Alumnos por grado</h2>
      <div className="rounded-xl border p-5 space-y-2" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        {Object.keys(d.porGrado).length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>Sin datos</p>}
        {Object.entries(d.porGrado).sort().map(([grado, n]) => (
          <div key={grado} className="flex items-center gap-3">
            <span className="text-xs w-20 shrink-0" style={{ color: "var(--fg)" }}>{grado}</span>
            <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div className="h-full bg-primary-500 rounded-full flex items-center justify-end pr-2" style={{ width: `${(n / maxGrado) * 100}%` }}>
                <span className="text-[10px] text-white font-medium">{n}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Card({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className={`text-2xl font-bold ${accent ?? ""}`} style={accent ? {} : { color: "var(--fg)" }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{label}</p>
    </div>
  )
}
