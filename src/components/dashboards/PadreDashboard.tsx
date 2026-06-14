"use client"

import { useState, useEffect } from "react"
import type { Session } from "next-auth"
import Link from "next/link"

type Child = {
  studentName: string; section: string; level: string
  attendance: { present: number; late: number; absent: number; total: number }
  grades: { course: string; display: string }[]
  conducta: { id: string }[]
  payments: { month: number; year: number; amount: number; status: string; paid: number }[]
}

export default function PadreDashboard({ session }: { session: Session | null }) {
  const name = session?.user?.name?.split(" ")[0] ?? "Apoderado"
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/portal").then(r => r.json()).then(d => { setChildren(d.children ?? []); setLoading(false) })
  }, [])

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Hola, {name} 👋</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: "var(--muted)" }}>Bienvenido al portal familiar de I.E.P. Cristo Reina</p>

      {loading && <p className="text-sm" style={{ color: "var(--muted)" }}>Cargando...</p>}
      {!loading && children.length === 0 && (
        <div className="rounded-xl border p-8 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Tu cuenta aún no está vinculada a ningún alumno. Contacta a la dirección del colegio.</p>
        </div>
      )}

      {/* Resumen rápido por hijo */}
      {children.map((c, idx) => {
        const pct = c.attendance.total ? Math.round(((c.attendance.present + c.attendance.late) / c.attendance.total) * 100) : null
        const deuda = c.payments.filter(p => p.status !== "paid").reduce((s, p) => s + (p.amount - p.paid), 0)
        return (
          <div key={idx} className="rounded-xl border p-5 mb-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="font-bold" style={{ color: "var(--fg)" }}>{c.studentName}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{c.level} · {c.section}</p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <Mini label="Asistencia" value={pct != null ? `${pct}%` : "—"} color="text-green-600" />
              <Mini label="Notas" value={c.grades.length} color="text-primary-600" />
              <Mini label="Deuda" value={deuda > 0 ? `S/ ${deuda.toFixed(0)}` : "S/ 0"} color={deuda > 0 ? "text-red-600" : "text-green-600"} />
            </div>
          </div>
        )
      })}

      {children.length > 0 && (
        <Link href="/dashboard/portal" className="block w-full text-center px-4 py-3 rounded-xl bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 transition-colors">
          Ver detalle completo (notas, conducta, asistencia, pagos) →
        </Link>
      )}
    </div>
  )
}

function Mini({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-lg border p-2 text-center" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px]" style={{ color: "var(--muted)" }}>{label}</p>
    </div>
  )
}
