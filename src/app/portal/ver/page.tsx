"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type Daily = { date: string; status: string; entryAt: string | null; exitAt: string | null }
type Child = {
  studentId: string
  studentName: string
  level: string
  section: string
  grades: { course: string; period: string; display: string }[]
  attendance: { present: number; late: number; absent: number; total: number }
  attendanceDaily: Daily[]
  conducta: { id: string; type: string; title: string | null; description: string; severity: string; date: string }[]
  payments: { month: number; year: number; amount: number; status: string; paid: number }[]
}

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
function hora(d: string | null): string {
  if (!d) return "—"
  return new Date(d).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
}

export default function PortalVer() {
  const [parentName, setParentName] = useState("")
  const [child, setChild] = useState<Child | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"notas" | "conducta" | "asistencia" | "pagos">("notas")
  const router = useRouter()

  useEffect(() => {
    fetch("/api/portal/data")
      .then(r => {
        if (r.status === 401) { router.replace("/portal"); return null }
        return r.json()
      })
      .then(d => {
        if (d) { setParentName(d.parentName ?? ""); setChild(d.child) }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  async function handleLogout() {
    await fetch("/api/portal/logout", { method: "POST" })
    router.replace("/portal")
  }

  if (loading) return (
    <div style={{ minHeight: "100dvh", background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#5A6A8A", fontSize: 14 }}>Cargando...</p>
    </div>
  )

  if (!child) return null

  return (
    <div style={{ minHeight: "100dvh", background: "#EEF2FF" }}>
      {/* Top bar */}
      <nav style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(26,51,204,0.10)",
        boxShadow: "0 1px 8px rgba(13,30,58,0.07)",
        padding: "0 20px",
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-cr.png" alt="" style={{ width: 24, height: 30, objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#0D1E3A", lineHeight: 1 }}>Cristo Reina</div>
            {parentName && <div style={{ fontSize: 10, color: "#5A6A8A" }}>Hola, {parentName.split(" ")[0]}</div>}
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            border: "1px solid #DDE3F0", color: "#5A6A8A", background: "transparent", cursor: "pointer",
          }}
        >
          Salir
        </button>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 48px" }}>
        {/* Student card */}
        <div style={{
          background: "linear-gradient(135deg, #0D1E3A 0%, #1A33CC 100%)",
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 16,
          boxShadow: "0 4px 20px rgba(13,30,58,0.18)",
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            👨‍🎓
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#FFFFFF", margin: 0, lineHeight: 1.1 }}>
              {child.studentName}
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 3, margin: "4px 0 0" }}>
              {child.level}{child.section ? ` · ${child.section}` : ""}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 2 }}>
          {[
            { k: "notas",      l: "📊 Notas" },
            { k: "asistencia", l: "📅 Asistencia" },
            { k: "conducta",   l: "📋 Conducta" },
            { k: "pagos",      l: "💳 Pagos" },
          ].map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as typeof tab)}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: "nowrap",
                border: tab === t.k ? "none" : "1px solid #D8E0F3",
                background: tab === t.k ? "#1A33CC" : "#FFFFFF",
                color: tab === t.k ? "#FFFFFF" : "#5A6A8A",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* NOTAS */}
        {tab === "notas" && (
          child.grades.length === 0
            ? <Empty text="Sin notas registradas aún" />
            : (
              <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #D8E0F3", overflow: "hidden" }}>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFF" }}>
                      {["Curso", "Bimestre", "Nota"].map(h => (
                        <th key={h} style={{ textAlign: h === "Nota" ? "right" : "left", padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#5A6A8A", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {child.grades.map((g, i) => {
                      const num = parseFloat(g.display)
                      const color = isNaN(num) ? "#0D1E3A" : num >= 14 ? "#15803D" : num >= 11 ? "#B45309" : "#DC2626"
                      return (
                        <tr key={i} style={{ borderTop: "1px solid #EEF2FF" }}>
                          <td style={{ padding: "10px 16px", color: "#0D1E3A", fontWeight: 500 }}>{g.course}</td>
                          <td style={{ padding: "10px 16px", color: "#5A6A8A", fontSize: 12 }}>{g.period}</td>
                          <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 800, color }}>{g.display}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
        )}

        {/* ASISTENCIA */}
        {tab === "asistencia" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
              <Mini label="Presente" value={child.attendance.present} color="#15803D" bg="#DCFCE7" />
              <Mini label="Tarde" value={child.attendance.late} color="#B45309" bg="#FFFBEB" />
              <Mini label="Ausente" value={child.attendance.absent} color="#DC2626" bg="#FEF2F2" />
              <Mini
                label="% Asist."
                value={child.attendance.total ? `${Math.round(((child.attendance.present + child.attendance.late) / child.attendance.total) * 100)}%` : "—"}
                color="#1A33CC"
                bg="#EEF2FF"
              />
            </div>
            {child.attendanceDaily.length === 0
              ? <Empty text="Sin registros de asistencia este mes" />
              : (
                <div style={{ background: "#FFFFFF", borderRadius: 14, border: "1px solid #D8E0F3", overflow: "hidden" }}>
                  <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#F8FAFF" }}>
                        {["Fecha", "Estado", "Ingreso", "Salida"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#5A6A8A", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {child.attendanceDaily.map((d, i) => (
                        <tr key={i} style={{ borderTop: "1px solid #EEF2FF" }}>
                          <td style={{ padding: "10px 16px", color: "#0D1E3A" }}>{new Date(d.date).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })}</td>
                          <td style={{ padding: "10px 16px" }}>
                            {d.status === "present" ? <span style={{ color: "#15803D", fontSize: 12, fontWeight: 600 }}>Presente</span>
                              : d.status === "late" ? <span style={{ color: "#B45309", fontSize: 12, fontWeight: 600 }}>Tarde</span>
                                : <span style={{ color: "#DC2626", fontSize: 12, fontWeight: 600 }}>Ausente</span>}
                          </td>
                          <td style={{ padding: "10px 16px", color: "#5A6A8A" }}>{hora(d.entryAt)}</td>
                          <td style={{ padding: "10px 16px", color: "#5A6A8A" }}>{hora(d.exitAt)}</td>
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
          child.conducta.length === 0
            ? <Empty text="Sin incidencias ni reconocimientos" />
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {child.conducta.map(inc => (
                  <div key={inc.id} style={{
                    background: "#FFFFFF", borderRadius: 12, border: "1px solid #D8E0F3",
                    padding: "14px 16px", display: "flex", gap: 12,
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                      background: inc.type === "positive" ? "#22C55E" : inc.severity === "high" ? "#EF4444" : "#F59E0B",
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{
                          fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 700,
                          background: inc.type === "positive" ? "#DCFCE7" : "#FEE2E2",
                          color: inc.type === "positive" ? "#15803D" : "#DC2626",
                        }}>
                          {inc.type === "positive" ? "Reconocimiento" : "Incidencia"}
                        </span>
                        {inc.title && <span style={{ fontSize: 13, fontWeight: 600, color: "#0D1E3A" }}>{inc.title}</span>}
                      </div>
                      <p style={{ fontSize: 13, color: "#5A6A8A", margin: "0 0 4px" }}>{inc.description}</p>
                      <p style={{ fontSize: 11, color: "#8A9ABB", margin: 0 }}>
                        {new Date(inc.date).toLocaleDateString("es-PE", { day: "numeric", month: "long" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )
        )}

        {/* PAGOS */}
        {tab === "pagos" && (
          child.payments.length === 0
            ? <Empty text="Sin pensiones registradas" />
            : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {child.payments.map((p, i) => {
                  const paid = p.status === "paid"
                  return (
                    <div key={i} style={{
                      padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, minWidth: 90,
                      background: paid ? "#DCFCE7" : "#FEF9C3",
                      color: paid ? "#15803D" : "#B45309",
                      border: `1px solid ${paid ? "#BBF7D0" : "#FDE68A"}`,
                    }}>
                      <div>{MESES[(p.month ?? 1) - 1]} {p.year}</div>
                      <div style={{ fontWeight: 800, marginTop: 2 }}>
                        {paid ? "✓ Pagado" : `S/ ${(p.amount - p.paid).toFixed(0)} pend.`}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
        )}
      </div>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{
      background: "#FFFFFF", borderRadius: 14, border: "1px solid #D8E0F3",
      padding: "40px 24px", textAlign: "center",
    }}>
      <p style={{ fontSize: 13, color: "#8A9ABB", margin: 0 }}>{text}</p>
    </div>
  )
}

function Mini({ label, value, color, bg }: { label: string; value: string | number; color: string; bg: string }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
      <p style={{ fontSize: 20, fontWeight: 900, color, margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 10, color: "#5A6A8A", marginTop: 3, margin: "4px 0 0" }}>{label}</p>
    </div>
  )
}
