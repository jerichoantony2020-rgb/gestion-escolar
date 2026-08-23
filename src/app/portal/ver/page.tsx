"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type Daily = { date: string; status: string; entryAt: string | null; exitAt: string | null }
type Grade = {
  area: string; course: string; competencia: string
  periodId: string; periodNumber: number; period: string
  score: number | null; level: string; display: string
}
type Child = {
  studentId: string
  studentName: string
  level: string
  section: string
  grades: Grade[]
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
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "var(--muted)", fontSize: 14 }}>Cargando...</p>
    </div>
  )

  if (!child) return null

  const iniciales = child.studentName.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)" }}>
      {/* Campo de cabecera: el color ocupa una región entera de la pantalla. */}
      <div className="brand-field">
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px" }}>
          <nav style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-cr.png" alt="" style={{ width: 26, height: 32, objectFit: "contain" }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 650, lineHeight: 1.2, letterSpacing: "-.01em" }}>Cristo Reina</div>
                {parentName && <div style={{ fontSize: 12, color: "rgba(255,255,255,.72)", lineHeight: 1.2 }}>{parentName.split(" ")[0]}</div>}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: "7px 14px", borderRadius: "var(--r-sm)", fontSize: 13, fontWeight: 550,
                border: "1px solid rgba(255,255,255,.3)", background: "rgba(255,255,255,.12)", cursor: "pointer",
              }}
            >
              Salir
            </button>
          </nav>

          <header style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 0 26px" }}>
            <div className="brand-avatar">{iniciales}</div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 23, fontWeight: 680, margin: 0, lineHeight: 1.18, letterSpacing: "-.022em" }}>
                {child.studentName}
              </h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,.75)", margin: "3px 0 0" }}>
                {child.level}{child.section ? ` · ${child.section}` : ""}
              </p>
            </div>
          </header>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "22px 16px 56px" }}>

        {/* Navegación segmentada: una sola pieza, no botones sueltos. */}
        <div style={{
          display: "flex", gap: 2, marginBottom: 22, overflowX: "auto",
          background: "var(--surface-2)", border: "1px solid var(--border)",
          borderRadius: "var(--r-md)", padding: 3,
        }}>
          {[
            { k: "notas",      l: "Notas" },
            { k: "asistencia", l: "Asistencia" },
            { k: "conducta",   l: "Conducta" },
            { k: "pagos",      l: "Pagos" },
          ].map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as typeof tab)}
              aria-current={tab === t.k ? "page" : undefined}
              style={{
                flex: 1, padding: "8px 12px",
                borderRadius: 9,
                fontSize: 13.5,
                fontWeight: tab === t.k ? 620 : 520,
                whiteSpace: "nowrap",
                border: "none",
                background: tab === t.k ? "var(--brand)" : "transparent",
                boxShadow: tab === t.k ? "var(--shadow-1)" : "none",
                color: tab === t.k ? "#fff" : "var(--muted)",
                cursor: "pointer",
                transition: "color .15s ease, background .15s ease",
              }}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* NOTAS */}
        {tab === "notas" && <NotasTab grades={child.grades} />}

        {/* ASISTENCIA */}
        {tab === "asistencia" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
              <Mini label="Presente" value={child.attendance.present} color="var(--ok)" bg="var(--ok-bg)" />
              <Mini label="Tarde" value={child.attendance.late} color="var(--warn)" bg="var(--warn-bg)" />
              <Mini label="Ausente" value={child.attendance.absent} color="var(--danger)" bg="var(--danger-bg)" />
              <Mini
                label="% Asist."
                value={child.attendance.total ? `${Math.round(((child.attendance.present + child.attendance.late) / child.attendance.total) * 100)}%` : "—"}
                color="var(--brand)"
                bg="var(--brand-bg)"
              />
            </div>
            {child.attendanceDaily.length === 0
              ? <Empty text="Sin registros de asistencia este mes" />
              : (
                <div style={{ background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
                  <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "var(--surface-2)" }}>
                        {["Fecha", "Estado", "Ingreso", "Salida"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {child.attendanceDaily.map((d, i) => (
                        <tr key={i} style={{ borderTop: "1px solid var(--brand-bg)" }}>
                          <td style={{ padding: "10px 16px", color: "var(--fg)" }}>{new Date(d.date).toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" })}</td>
                          <td style={{ padding: "10px 16px" }}>
                            {d.status === "present" ? <span style={{ color: "var(--ok)", fontSize: 12, fontWeight: 600 }}>Presente</span>
                              : d.status === "late" ? <span style={{ color: "var(--warn)", fontSize: 12, fontWeight: 600 }}>Tarde</span>
                                : <span style={{ color: "var(--danger)", fontSize: 12, fontWeight: 600 }}>Ausente</span>}
                          </td>
                          <td style={{ padding: "10px 16px", color: "var(--muted)" }}>{hora(d.entryAt)}</td>
                          <td style={{ padding: "10px 16px", color: "var(--muted)" }}>{hora(d.exitAt)}</td>
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
                    background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)",
                    padding: "14px 16px", display: "flex", gap: 12,
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                      background: inc.type === "positive" ? "var(--ok)" : inc.severity === "high" ? "var(--danger)" : "var(--warn)",
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{
                          fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 700,
                          background: inc.type === "positive" ? "var(--ok-bg)" : "var(--danger-bg)",
                          color: inc.type === "positive" ? "var(--ok)" : "var(--danger)",
                        }}>
                          {inc.type === "positive" ? "Reconocimiento" : "Incidencia"}
                        </span>
                        {inc.title && <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{inc.title}</span>}
                      </div>
                      <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 4px" }}>{inc.description}</p>
                      <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
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
                      background: paid ? "var(--ok-bg)" : "var(--warn-bg)",
                      color: paid ? "var(--ok)" : "var(--warn)",
                      border: `1px solid ${paid ? "var(--ok-bg)" : "var(--warn-bg)"}`,
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
      background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)",
      padding: "40px 24px", textAlign: "center",
    }}>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>{text}</p>
    </div>
  )
}

function notaColor(score: number | null): string {
  if (score == null) return "var(--fg)"
  if (score >= 18) return "var(--ok)"
  if (score >= 14) return "var(--brand-ink)"
  if (score >= 11) return "var(--warn)"
  return "var(--danger)"
}

/**
 * Notas agrupadas por área y bimestre. Cada área se pliega para que en celular
 * el apoderado vea de un vistazo la nota que va a la libreta y abra el detalle
 * solo si le interesa.
 */
function NotasTab({ grades }: { grades: Grade[] }) {
  const periods = [...new Map(grades.map(g => [g.periodId, { id: g.periodId, name: g.period, number: g.periodNumber }])).values()]
    .sort((a, b) => a.number - b.number)

  const [periodId, setPeriodId] = useState(() => periods.length ? periods[periods.length - 1].id : "")
  const [openArea, setOpenArea] = useState<string | null>(null)

  if (grades.length === 0) return <Empty text="Sin notas registradas aún" />

  const ofPeriod = grades.filter(g => g.periodId === periodId)
  const areas = [...new Map(ofPeriod.map(g => [g.area, g.area])).keys()].sort((a, b) => a.localeCompare(b))

  return (
    <>
      {periods.length > 1 && (
        <div style={{ display: "flex", gap: 18, marginBottom: 18, overflowX: "auto", borderBottom: "1px solid var(--border)" }}>
          {periods.map(p => (
            <button key={p.id} onClick={() => setPeriodId(p.id)}
              aria-current={p.id === periodId ? "true" : undefined}
              style={{
                padding: "0 0 10px", background: "none", border: "none", cursor: "pointer",
                fontSize: 13.5, whiteSpace: "nowrap",
                fontWeight: p.id === periodId ? 620 : 520,
                color: p.id === periodId ? "var(--fg)" : "var(--muted)",
                boxShadow: p.id === periodId ? "inset 0 -2px 0 var(--brand)" : "none",
                transition: "color .16s ease",
              }}>
              {p.name.replace(" Bimestre", "")}
            </button>
          ))}
        </div>
      )}

      {areas.length === 0 && <Empty text="Sin notas en este bimestre" />}

      <div style={{ display: "grid", gap: 10 }}>
        {areas.map((area, ai) => {
          const items = ofPeriod.filter(g => g.area === area)
          const scored = items.filter(i => i.score != null)
          const avg = scored.length
            ? Math.round((scored.reduce((s, i) => s + (i.score ?? 0), 0) / scored.length) * 10) / 10
            : null
          const open = openArea === area
          return (
            <div key={area} className="area-card rise" data-open={open} data-nivel={nivelDe(avg)}
              style={{ animationDelay: `${ai * 55}ms` }}>
              <button className="area-head" onClick={() => setOpenArea(open ? null : area)} aria-expanded={open}>
                <span style={{ minWidth: 0 }}>
                  <span className="area-name" style={{ display: "block" }}>{area}</span>
                  <span style={{ display: "block", fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                    {items.length} {items.length === 1 ? "curso" : "cursos"}
                  </span>
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  <span className="area-score" style={{ color: notaColor(avg) }}>{avg ?? "—"}</span>
                  <span className={`nivel nivel-${nivelDe(avg) || "vacio"}`}>{nivelDe(avg) || "—"}</span>
                  <Chevron />
                </span>
              </button>

              {open && (
                <div className="unfold" style={{ borderTop: "1px solid var(--border)", padding: "4px 0 6px" }}>
                  {items.map((g, i) => (
                    <div key={i} className="rise" style={{
                      animationDelay: `${i * 40}ms`,
                      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
                      padding: "11px 18px",
                    }}>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", fontSize: 13.5, fontWeight: 560, color: "var(--fg-2)", letterSpacing: "-.006em" }}>{g.course}</span>
                        {g.course !== g.competencia && (
                          <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginTop: 2, lineHeight: 1.35 }}>{g.competencia}</span>
                        )}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        <span style={{ fontSize: 15, fontWeight: 650, color: notaColor(g.score), fontVariantNumeric: "tabular-nums" }}>
                          {g.score ?? "—"}
                        </span>
                        <span className={`nivel nivel-${g.level || "vacio"}`}>{g.level || "—"}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function nivelDe(score: number | null): string {
  if (score == null) return ""
  if (score >= 18) return "AD"
  if (score >= 14) return "A"
  if (score >= 11) return "B"
  return "C"
}

function Chevron() {
  return (
    <svg className="area-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

function Mini({ label, value, color, bg }: { label: string; value: string | number; color: string; bg: string }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
      <p style={{ fontSize: 20, fontWeight: 900, color, margin: 0, lineHeight: 1 }}>{value}</p>
      <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 3, margin: "4px 0 0" }}>{label}</p>
    </div>
  )
}
