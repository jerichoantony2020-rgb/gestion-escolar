"use client"

import { useState, useEffect } from "react"
import type { Session } from "next-auth"
import Link from "next/link"
import { IconAsistencia, IconNotas, IconFinanzas } from "@/components/icons"

type Child = {
  studentName: string; section: string; level: string
  attendance: { present: number; late: number; absent: number; total: number }
  grades: { course: string; display: string }[]
  conducta: { id: string }[]
  payments: { month: number; year: number; amount: number; status: string; paid: number }[]
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Buenos días"
  if (h < 19) return "Buenas tardes"
  return "Buenas noches"
}

export default function PadreDashboard({ session }: { session: Session | null }) {
  const name = session?.user?.name?.split(" ")[0] ?? "Apoderado"
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    fetch("/api/portal")
      .then(r => (r.ok ? r.json() : Promise.reject(new Error("no-data"))))
      .then(d => { if (alive) { setChildren(d.children ?? []); setLoading(false) } })
      .catch(() => { if (alive) { setFailed(true); setLoading(false) } })
    return () => { alive = false }
  }, [])

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 20px 48px" }}>

      <header style={{
        borderRadius: 22,
        background: "linear-gradient(135deg, #0D1E3A 0%, #16306B 58%, #1A33CC 100%)",
        padding: "clamp(24px,4vw,34px) clamp(22px,4vw,34px)",
        marginBottom: 28,
        boxShadow: "0 2px 6px rgba(13,30,58,0.10), 0 18px 40px rgba(13,30,58,0.20)",
        position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(circle at 90% 15%, rgba(240,200,0,.14), transparent 45%), radial-gradient(circle at 70% 120%, rgba(71,181,232,.16), transparent 50%)",
        }} />
        <div style={{ position: "relative" }}>
          <h1 suppressHydrationWarning style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 800, color: "#FFFFFF", margin: "0 0 8px", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {greeting()}, {name}
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.68)", margin: 0 }}>
            Portal familiar · I.E.P. Cristo Reina
          </p>
        </div>
      </header>

      {loading && (
        <div className="rounded-xl border p-8 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Cargando la información de tus hijos…</p>
        </div>
      )}

      {failed && (
        <div className="rounded-xl border p-6" style={{ background: "#FFF7ED", borderColor: "#FED7AA" }}>
          <p className="text-sm font-semibold" style={{ color: "#9A3412" }}>No pudimos cargar la información</p>
          <p className="text-sm mt-1" style={{ color: "#9A3412" }}>Revisa tu conexión y vuelve a intentarlo. Si continúa, avisa a la dirección del colegio.</p>
        </div>
      )}

      {!loading && !failed && children.length === 0 && (
        <div className="rounded-xl border p-8 text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Tu cuenta aún no está vinculada a ningún alumno. Contacta a la dirección del colegio.
          </p>
        </div>
      )}

      {children.map((c, idx) => {
        const pct = c.attendance.total ? Math.round(((c.attendance.present + c.attendance.late) / c.attendance.total) * 100) : null
        const deuda = c.payments.filter(p => p.status !== "paid").reduce((s, p) => s + (p.amount - p.paid), 0)
        return (
          <div key={idx} className="rounded-2xl border mb-4 overflow-hidden" style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 1px 3px rgba(13,30,58,0.06)" }}>
            <div className="px-5 pt-5 pb-4">
              <p className="font-bold text-base" style={{ color: "var(--fg)" }}>{c.studentName}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{c.level} · {c.section}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "#EDF1F9" }}>
              <Mini Icon={IconAsistencia} label="Asistencia" value={pct != null ? `${pct}%` : "—"} tone="#15803D" soft="#DCFCE7" />
              <Mini Icon={IconNotas} label="Cursos con nota" value={c.grades.length} tone="#1A33CC" soft="#EEF2FF" />
              <Mini Icon={IconFinanzas} label="Deuda" value={deuda > 0 ? `S/ ${deuda.toFixed(0)}` : "S/ 0"} tone={deuda > 0 ? "#B91C1C" : "#15803D"} soft={deuda > 0 ? "#FEE2E2" : "#DCFCE7"} />
            </div>
          </div>
        )
      })}

      {children.length > 0 && (
        <Link href="/dashboard/portal" className="quick-link" style={{ width: "100%", justifyContent: "center", padding: "13px 18px", fontSize: 14 }}>
          Ver detalle completo — notas, conducta, asistencia y pagos
        </Link>
      )}
    </div>
  )
}

function Mini({ Icon, label, value, tone, soft }: {
  Icon: (p: { size?: number }) => React.ReactElement
  label: string; value: string | number; tone: string; soft: string
}) {
  return (
    <div style={{ background: "var(--surface)", padding: "14px 10px", textAlign: "center" }}>
      <span style={{
        width: 30, height: 30, borderRadius: 9, background: soft, color: tone,
        display: "inline-grid", placeItems: "center", marginBottom: 7,
      }}>
        <Icon size={17} />
      </span>
      <p style={{ fontSize: 18, fontWeight: 800, color: tone, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</p>
      <p style={{ fontSize: 11, marginTop: 4, color: "var(--muted)" }}>{label}</p>
    </div>
  )
}
