"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

type Enrollment = { section: { name: string }; grade: { name: string } }
type Student = { firstName: string; lastName: string; enrollments: Enrollment[] }
type Session_ = { date: string }
type Case = {
  id: string
  status: string
  mainReason: string
  referralSource: string
  openedAt: string
  student: Student
  sessions: Session_[]
  _count: { sessions: number }
}

const STATUS_LABEL: Record<string, string> = { activo: "Activo", cerrado: "Cerrado" }
const STATUS_COLOR: Record<string, string> = {
  activo: "#16a34a",
  cerrado: "#6b7280",
}
const REFERRAL_LABEL: Record<string, string> = {
  directo: "Directo",
  docente: "Derivado por docente",
  director: "Derivado por dirección",
  apoderado: "Solicitud de apoderado",
}

export default function PsicologiaPage() {
  const { data: session } = useSession()
  const role = session?.user?.role ?? ""
  const isDocente = role === "docente"

  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"todos" | "activo" | "cerrado">("activo")
  const [showNew, setShowNew] = useState(false)
  const [students, setStudents] = useState<{ id: string; name: string; aula: string }[]>([])
  const [newForm, setNewForm] = useState({ studentId: "", mainReason: "", referralSource: "directo", notes: "" })
  const [saving, setSaving] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    const [casesData, derivData] = await Promise.all([
      fetch("/api/psicologia/casos").then(r => r.json()),
      fetch("/api/psicologia/derivaciones").then(r => r.json()),
    ])
    setCases(Array.isArray(casesData) ? casesData : [])
    if (Array.isArray(derivData)) setPendingCount(derivData.filter((d: { status: string }) => d.status === "pendiente").length)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function loadStudents() {
    const data = await fetch("/api/medico/lista").then(r => r.json())
    setStudents(data.map((s: { id: string; name: string; aula: string }) => ({ id: s.id, name: s.name, aula: s.aula })))
  }

  async function createCase(e: React.FormEvent) {
    e.preventDefault()
    if (!newForm.studentId || !newForm.mainReason) return
    setSaving(true)
    await fetch("/api/psicologia/casos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    })
    setSaving(false)
    setShowNew(false)
    setNewForm({ studentId: "", mainReason: "", referralSource: "directo", notes: "" })
    load()
  }

  const filtered = cases.filter(c => {
    const name = `${c.student.firstName} ${c.student.lastName}`.toLowerCase()
    const aula = c.student.enrollments[0]?.grade?.name ?? ""
    if (search && !name.includes(search.toLowerCase()) && !aula.toLowerCase().includes(search.toLowerCase())) return false
    if (filter !== "todos" && c.status !== filter) return false
    return true
  })

  const byGrade: Record<string, Case[]> = {}
  for (const c of filtered) {
    const grade = c.student.enrollments[0]?.grade?.name ?? "Sin grado"
    ;(byGrade[grade] ??= []).push(c)
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0D1E3A", margin: 0 }}>Área de Psicología</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>Seguimiento psicológico de estudiantes</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {pendingCount > 0 && (
            <Link href="/dashboard/psicologia/derivaciones" style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 10,
              background: "#fef3c7", border: "1px solid #f59e0b",
              color: "#92400e", fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}>
              ⚠️ {pendingCount} derivación{pendingCount > 1 ? "es" : ""} pendiente{pendingCount > 1 ? "s" : ""}
            </Link>
          )}
          <Link href="/dashboard/psicologia/derivaciones" style={{
            padding: "8px 14px", borderRadius: 10, border: "1px solid #e5e7eb",
            color: "#374151", fontSize: 13, fontWeight: 600, textDecoration: "none",
            background: "#fff",
          }}>
            Derivaciones
          </Link>
          {!isDocente && (
            <button onClick={() => { setShowNew(true); loadStudents() }} style={{
              padding: "8px 16px", borderRadius: 10, background: "#0D1E3A",
              color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer",
            }}>
              + Nuevo caso
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          placeholder="Buscar alumno o grado..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: "8px 12px", borderRadius: 8,
            border: "1px solid #e5e7eb", fontSize: 14, outline: "none",
          }}
        />
        {(["todos", "activo", "cerrado"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
            background: filter === f ? "#0D1E3A" : "#f3f4f6",
            color: filter === f ? "#fff" : "#374151",
          }}>
            {f === "todos" ? "Todos" : f === "activo" ? "Activos" : "Cerrados"}
          </button>
        ))}
      </div>

      {/* Cases by grade */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Cargando...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧠</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No hay casos registrados</div>
          <div style={{ fontSize: 13 }}>Crea el primer caso con el botón "Nuevo caso"</div>
        </div>
      ) : (
        Object.entries(byGrade).sort(([a], [b]) => a.localeCompare(b)).map(([grade, gradeCases]) => (
          <div key={grade} style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
              {grade} — {gradeCases.length} caso{gradeCases.length > 1 ? "s" : ""}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {gradeCases.map(c => {
                const lastSession = c.sessions[0]
                const enrollment = c.student.enrollments[0]
                return (
                  <Link key={c.id} href={`/dashboard/psicologia/casos/${c.id}`} style={{ textDecoration: "none" }}>
                    <div style={{
                      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
                      padding: "14px 18px", display: "flex", alignItems: "center", gap: 14,
                      transition: "box-shadow .15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 12px rgba(13,30,58,0.10)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                        background: c.status === "activo" ? "#dcfce7" : "#f3f4f6",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                      }}>
                        🧠
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#0D1E3A" }}>
                          {c.student.firstName} {c.student.lastName}
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                          {enrollment?.grade?.name} — {enrollment?.section?.name} · {REFERRAL_LABEL[c.referralSource] ?? c.referralSource}
                        </div>
                        <div style={{ fontSize: 12, color: "#374151", marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.mainReason}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{
                          display: "inline-block", padding: "3px 10px", borderRadius: 20,
                          fontSize: 11, fontWeight: 700,
                          background: c.status === "activo" ? "#dcfce7" : "#f3f4f6",
                          color: STATUS_COLOR[c.status],
                        }}>
                          {STATUS_LABEL[c.status]}
                        </span>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
                          {c._count.sessions} sesión{c._count.sessions !== 1 ? "es" : ""}
                          {lastSession && ` · última: ${new Date(lastSession.date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}`}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))
      )}

      {/* New case modal */}
      {showNew && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }} onClick={() => setShowNew(false)}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0D1E3A", marginTop: 0, marginBottom: 20 }}>Nuevo caso psicológico</h2>
            <form onSubmit={createCase}>
              <label style={labelStyle}>Alumno</label>
              <select value={newForm.studentId} onChange={e => setNewForm(f => ({ ...f, studentId: e.target.value }))} required style={inputStyle}>
                <option value="">Selecciona un alumno...</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} — {s.aula}</option>
                ))}
              </select>

              <label style={{ ...labelStyle, marginTop: 14 }}>Motivo principal</label>
              <textarea value={newForm.mainReason} onChange={e => setNewForm(f => ({ ...f, mainReason: e.target.value }))}
                required rows={3} placeholder="Describe el motivo de la apertura del caso..." style={{ ...inputStyle, resize: "vertical" }} />

              <label style={{ ...labelStyle, marginTop: 14 }}>Origen de derivación</label>
              <select value={newForm.referralSource} onChange={e => setNewForm(f => ({ ...f, referralSource: e.target.value }))} style={inputStyle}>
                <option value="directo">Directo (iniciativa del psicólogo)</option>
                <option value="docente">Derivado por docente</option>
                <option value="director">Derivado por dirección</option>
                <option value="apoderado">Solicitud del apoderado</option>
              </select>

              <label style={{ ...labelStyle, marginTop: 14 }}>Notas iniciales (opcional)</label>
              <textarea value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="Observaciones iniciales..." style={{ ...inputStyle, resize: "vertical" }} />

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => setShowNew(false)} style={{
                  flex: 1, padding: 12, borderRadius: 10, border: "1px solid #e5e7eb",
                  background: "#f9fafb", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{
                  flex: 1, padding: 12, borderRadius: 10, border: "none",
                  background: "#0D1E3A", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}>
                  {saving ? "Guardando..." : "Crear caso"}
                </button>
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
