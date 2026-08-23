"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

type Enrollment = { section: { name: string }; grade: { name: string } }
type Student = { firstName: string; lastName: string; enrollments: Enrollment[] }
type Derivation = {
  id: string
  status: string
  reason: string
  createdAt: string
  respondedAt: string | null
  caseId: string | null
  student: Student
  requestedBy: { name: string }
}

const STATUS_LABEL: Record<string, string> = { pendiente: "Pendiente", aceptada: "Aceptada", rechazada: "Rechazada" }
const STATUS_COLOR: Record<string, { bg: string; color: string }> = {
  pendiente: { bg: "#fef3c7", color: "#92400e" },
  aceptada:  { bg: "#dcfce7", color: "#16a34a" },
  rechazada: { bg: "#fee2e2", color: "#dc2626" },
}

export default function DerivacionesPage() {
  const { data: session } = useSession()
  const role = session?.user?.role ?? ""
  // Solo el psicólogo resuelve derivaciones; dirección/coordinación las ven.
  const canRespond = role === "psicologo"
  const isDocente = role === "docente"

  const [derivations, setDerivations] = useState<Derivation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"todas" | "pendiente" | "aceptada" | "rechazada">("pendiente")
  const [responding, setResponding] = useState<string | null>(null)
  const [mainReason, setMainReason] = useState("")

  // New derivation (docente)
  const [showNew, setShowNew] = useState(false)
  const [students, setStudents] = useState<{ id: string; name: string; aula: string }[]>([])
  const [newForm, setNewForm] = useState({ studentId: "", reason: "" })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch("/api/psicologia/derivaciones").then(r => r.json())
    setDerivations(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function loadStudents() {
    const data = await fetch("/api/medico/lista").then(r => r.json())
    setStudents(data.map((s: { id: string; name: string; aula: string }) => ({ id: s.id, name: s.name, aula: s.aula })))
  }

  async function respond(id: string, action: "aceptar" | "rechazar") {
    setResponding(id)
    await fetch(`/api/psicologia/derivaciones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, mainReason: mainReason || undefined }),
    })
    setResponding(null)
    setMainReason("")
    load()
  }

  async function createDerivation(e: React.FormEvent) {
    e.preventDefault()
    if (!newForm.studentId || !newForm.reason) return
    setSaving(true)
    await fetch("/api/psicologia/derivaciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    })
    setSaving(false)
    setShowNew(false)
    setNewForm({ studentId: "", reason: "" })
    load()
  }

  const filtered = derivations.filter(d => filter === "todas" || d.status === filter)

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Link href="/dashboard/psicologia" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>← Volver</Link>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0D1E3A", margin: "4px 0 0" }}>Derivaciones a Psicología</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>
            {isDocente ? "Tus solicitudes de derivación" : "Solicitudes recibidas de docentes"}
          </p>
        </div>
        {isDocente && (
          <button onClick={() => { setShowNew(true); loadStudents() }} style={{
            padding: "8px 16px", borderRadius: 10, background: "#0D1E3A",
            color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
          }}>
            + Nueva derivación
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {(["pendiente", "aceptada", "rechazada", "todas"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: "none", cursor: "pointer",
            background: filter === f ? "#0D1E3A" : "#f3f4f6",
            color: filter === f ? "#fff" : "#374151",
          }}>
            {f === "todas" ? "Todas" : STATUS_LABEL[f]}
            {f !== "todas" && ` (${derivations.filter(d => d.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af", border: "1px dashed #e5e7eb", borderRadius: 12 }}>
          No hay derivaciones {filter !== "todas" ? STATUS_LABEL[filter].toLowerCase() + "s" : ""}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(d => {
            const enrollment = d.student.enrollments[0]
            const colors = STATUS_COLOR[d.status] ?? { bg: "#f3f4f6", color: "#374151" }
            return (
              <div key={d.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#0D1E3A" }}>
                      {d.student.firstName} {d.student.lastName}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                      {enrollment?.grade?.name} · {enrollment?.section?.name}
                      {!isDocente && <> · Derivado por <strong>{d.requestedBy.name}</strong></>}
                    </div>
                    <p style={{ margin: "8px 0 0", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{d.reason}</p>
                    <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                      Solicitado {new Date(d.createdAt).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: colors.bg, color: colors.color }}>
                      {STATUS_LABEL[d.status]}
                    </span>
                    {d.caseId && (
                      <div style={{ marginTop: 8 }}>
                        <Link href={`/dashboard/psicologia/casos/${d.caseId}`} style={{ fontSize: 12, color: "#1A33CC", fontWeight: 600, textDecoration: "none" }}>
                          Ver caso →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Accept/reject buttons for psicólogo */}
                {canRespond && d.status === "pendiente" && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
                    <input
                      placeholder="Ajusta el motivo del caso (opcional)..."
                      value={mainReason}
                      onChange={e => setMainReason(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, marginBottom: 10, boxSizing: "border-box" as const, outline: "none" }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => respond(d.id, "rechazar")} disabled={responding === d.id} style={{
                        padding: "8px 18px", borderRadius: 8, background: "#fee2e2", color: "#dc2626",
                        border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
                      }}>
                        Rechazar
                      </button>
                      <button onClick={() => respond(d.id, "aceptar")} disabled={responding === d.id} style={{
                        padding: "8px 18px", borderRadius: 8, background: "#0D1E3A", color: "#fff",
                        border: "none", fontWeight: 700, fontSize: 13, cursor: "pointer",
                      }}>
                        {responding === d.id ? "Procesando..." : "Aceptar y crear caso"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New derivation modal (docente) */}
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setShowNew(false)}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 460, width: "100%" }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0D1E3A", marginTop: 0, marginBottom: 20 }}>Solicitar derivación a Psicología</h2>
            <form onSubmit={createDerivation}>
              <label style={labelStyle}>Alumno</label>
              <select value={newForm.studentId} onChange={e => setNewForm(f => ({ ...f, studentId: e.target.value }))} required style={inputStyle}>
                <option value="">Selecciona un alumno...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.aula}</option>)}
              </select>
              <label style={{ ...labelStyle, marginTop: 14 }}>Motivo de derivación</label>
              <textarea value={newForm.reason} onChange={e => setNewForm(f => ({ ...f, reason: e.target.value }))}
                required rows={4} placeholder="Describe el motivo por el que solicitas esta derivación..."
                style={{ ...inputStyle, resize: "vertical" as const }} />
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setShowNew(false)} style={btnSecondary}>Cancelar</button>
                <button type="submit" disabled={saving} style={btnPrimary}>{saving ? "Enviando..." : "Enviar solicitud"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 700, color: "#6b7280",
  marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase",
}
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e5e7eb",
  fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
}
const btnPrimary: React.CSSProperties = {
  flex: 1, padding: "10px 18px", borderRadius: 10, background: "#0D1E3A",
  color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer",
}
const btnSecondary: React.CSSProperties = {
  padding: "8px 16px", borderRadius: 10, border: "1px solid #e5e7eb",
  background: "#f9fafb", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer",
}
