"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"

type Parent = { name: string; phone: string | null; relationship: string }
type GradeRecord = { course: { name: string }; period: { name: string; number: number }; finalGrade: number | null; qualitative: string | null }
type Incident = { id: string; date: string; title: string | null; description: string; severity: string; type: string }
type Enrollment = { section: { name: string }; grade: { name: string } }
type HealthRecord = { bloodType: string | null; allergies: string | null; conditions: string | null; medications: string | null }
type Student = { firstName: string; lastName: string; parents: Parent[]; enrollments: Enrollment[]; gradeRecords: GradeRecord[]; incidents: Incident[]; healthRecord?: HealthRecord | null }

/** "Ninguna" y variantes no son una nota médica que valga mostrar. */
function hasHealthNote(v: string | null | undefined): v is string {
  if (!v) return false
  const n = v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim()
  return !["ninguna", "ninguno", "ninguna conocida", "no tiene", "nada", "-", "no"].includes(n)
}
type PsychoSession = { id: string; date: string; type: string; summary: string; nextDate: string | null }
type Plan = { objectives: string; strategies: string; status: string } | null
type Contact = { id: string; channel: string; summary: string; contactedAt: string }
type Report = { id: string; name: string; fileUrl: string; fileType: string; type: string; uploadedAt: string; uploadedBy: { name: string } }
type Case = {
  id: string; status: string; mainReason: string; referralSource: string; openedAt: string; notes: string | null
  student: Student; sessions: PsychoSession[]; plan: Plan; contacts: Contact[]; reports: Report[]
  openedBy: { name: string }
}

const CHANNEL_LABEL: Record<string, string> = { whatsapp: "WhatsApp", mensaje: "Mensaje interno", llamada: "Llamada", presencial: "Presencial" }
const SESSION_TYPE: Record<string, string> = { individual: "Individual", grupal: "Grupal", con_apoderado: "Con apoderado" }
const REPORT_TYPE: Record<string, string> = { diagnostico: "Diagnóstico", evolucion: "Evolución", cierre: "Cierre" }

export default function CasoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const role = session?.user?.role ?? ""
  const isDocente = role === "docente"
  const canEdit = ["psicologo", "director", "coordinador"].includes(role)

  const [caso, setCaso] = useState<Case | null>(null)
  const [tab, setTab] = useState<"sesiones" | "plan" | "contactos" | "informes">(isDocente ? "informes" : "sesiones")
  const [loading, setLoading] = useState(true)

  // Session form
  const [showSession, setShowSession] = useState(false)
  const [sessionForm, setSessionForm] = useState({ date: "", type: "individual", summary: "", nextDate: "" })
  const [savingSession, setSavingSession] = useState(false)

  // Plan
  const [planEdit, setPlanEdit] = useState(false)
  const [objectives, setObjectives] = useState<string[]>([])
  const [strategies, setStrategies] = useState<string[]>([])
  const [planStatus, setPlanStatus] = useState("en_proceso")
  const [savingPlan, setSavingPlan] = useState(false)

  // Contact
  const [showContact, setShowContact] = useState(false)
  const [contactForm, setContactForm] = useState({ channel: "whatsapp", summary: "" })
  const [savingContact, setSavingContact] = useState(false)

  // Report upload
  const [showReport, setShowReport] = useState(false)
  const [reportFile, setReportFile] = useState<File | null>(null)
  const [reportName, setReportName] = useState("")
  const [reportType, setReportType] = useState("diagnostico")
  const [uploadingReport, setUploadingReport] = useState(false)

  // Close case
  const [closing, setClosing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch(`/api/psicologia/casos/${id}`).then(r => r.json())
    setCaso(data)
    if (data.plan) {
      setObjectives(JSON.parse(data.plan.objectives ?? "[]"))
      setStrategies(JSON.parse(data.plan.strategies ?? "[]"))
      setPlanStatus(data.plan.status)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function addSession(e: React.FormEvent) {
    e.preventDefault()
    setSavingSession(true)
    await fetch("/api/psicologia/sesiones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: id, ...sessionForm }),
    })
    setSavingSession(false)
    setShowSession(false)
    setSessionForm({ date: "", type: "individual", summary: "", nextDate: "" })
    load()
  }

  async function deleteSession(sid: string) {
    if (!confirm("¿Eliminar esta sesión?")) return
    await fetch(`/api/psicologia/sesiones/${sid}`, { method: "DELETE" })
    load()
  }

  async function savePlan() {
    setSavingPlan(true)
    await fetch("/api/psicologia/planes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: id, objectives, strategies, status: planStatus }),
    })
    setSavingPlan(false)
    setPlanEdit(false)
    load()
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault()
    setSavingContact(true)
    await fetch("/api/psicologia/contactos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: id, ...contactForm }),
    })
    setSavingContact(false)
    setShowContact(false)
    setContactForm({ channel: "whatsapp", summary: "" })
    load()
  }

  async function uploadReport(e: React.FormEvent) {
    e.preventDefault()
    if (!reportFile) return
    setUploadingReport(true)
    const fd = new FormData()
    fd.append("file", reportFile)
    fd.append("caseId", id)
    fd.append("type", reportType)
    fd.append("name", reportName || reportFile.name)
    await fetch("/api/psicologia/informes", { method: "POST", body: fd })
    setUploadingReport(false)
    setShowReport(false)
    setReportFile(null)
    setReportName("")
    load()
  }

  async function toggleClose() {
    if (!caso) return
    const newStatus = caso.status === "activo" ? "cerrado" : "activo"
    if (newStatus === "cerrado" && !confirm("¿Cerrar este caso?")) return
    setClosing(true)
    await fetch(`/api/psicologia/casos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    setClosing(false)
    load()
  }

  if (loading) return <div style={{ textAlign: "center", padding: 80, color: "#9ca3af" }}>Cargando caso...</div>
  if (!caso || (caso as { error?: string }).error) return <div style={{ textAlign: "center", padding: 80, color: "#ef4444" }}>Caso no encontrado</div>

  const student = caso.student
  const enrollment = student.enrollments[0]
  const mainParent = student.parents[0]

  const tabs = [
    ...(isDocente ? [] : [{ key: "sesiones" as const, label: "Sesiones", count: caso.sessions?.length }]),
    ...(isDocente ? [] : [{ key: "plan" as const, label: "Plan de Intervención" }]),
    ...(isDocente ? [] : [{ key: "contactos" as const, label: "Contacto Apoderado", count: caso.contacts?.length }]),
    { key: "informes" as const, label: "Informes", count: caso.reports?.length },
  ]

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "24px 16px" }}>
      {/* Back */}
      <Link href="/dashboard/psicologia" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
        ← Volver a casos
      </Link>

      {/* Student card */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: "20px 24px", marginBottom: 20, display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#0D1E3A" }}>
            {student.firstName} {student.lastName}
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
            {enrollment?.grade?.name} · {enrollment?.section?.name}
          </div>
          <div style={{ marginTop: 10, fontSize: 13, color: "#374151" }}>
            <span style={{ fontWeight: 600 }}>Motivo:</span> {caso.mainReason}
          </div>
          {caso.notes && (
            <div style={{ marginTop: 6, fontSize: 13, color: "#6b7280" }}>
              <span style={{ fontWeight: 600 }}>Notas:</span> {caso.notes}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{
            display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
            background: caso.status === "activo" ? "#dcfce7" : "#f3f4f6",
            color: caso.status === "activo" ? "#16a34a" : "#6b7280",
          }}>
            {caso.status === "activo" ? "Activo" : "Cerrado"}
          </span>
          <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
            Abierto {new Date(caso.openedAt).toLocaleDateString("es-PE")}
          </div>
          {!isDocente && canEdit && (
            <button onClick={toggleClose} disabled={closing} style={{
              marginTop: 10, padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: caso.status === "activo" ? "#fee2e2" : "#dcfce7",
              color: caso.status === "activo" ? "#dc2626" : "#16a34a",
              border: "none", cursor: "pointer",
            }}>
              {closing ? "..." : caso.status === "activo" ? "Cerrar caso" : "Reabrir caso"}
            </button>
          )}
        </div>
      </div>

      {/* Apoderado info (non-docente) */}
      {!isDocente && mainParent && (
        <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 12, padding: "12px 18px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 13 }}>
            <span style={{ fontWeight: 700, color: "#0369a1" }}>Apoderado:</span>{" "}
            <span style={{ color: "#0D1E3A" }}>{mainParent.name}</span>{" "}
            <span style={{ color: "#6b7280" }}>({mainParent.relationship})</span>
            {mainParent.phone && (
              <span style={{ marginLeft: 12, color: "#374151" }}>📞 {mainParent.phone}</span>
            )}
          </div>
          {mainParent.phone && (
            <a
              href={`https://wa.me/51${mainParent.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Estimado/a ${mainParent.name}, le contactamos del área de Psicología del I.E.P. Cristo Reina respecto a ${student.firstName} ${student.lastName}.`)}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 8, background: "#25d366",
                color: "#fff", fontWeight: 700, fontSize: 13, textDecoration: "none",
              }}
            >
              💬 Abrir WhatsApp
            </a>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid #e5e7eb", marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "10px 16px", fontSize: 14, fontWeight: tab === t.key ? 700 : 500,
            color: tab === t.key ? "#0D1E3A" : "#6b7280",
            borderBottom: tab === t.key ? "2px solid #0D1E3A" : "2px solid transparent",
            marginBottom: -2, background: "none", border: "none",
            borderBottomColor: tab === t.key ? "#0D1E3A" : "transparent",
            borderBottomWidth: 2, borderBottomStyle: "solid",
            cursor: "pointer", whiteSpace: "nowrap",
          }}>
            {t.label}{t.count !== undefined && t.count > 0 ? ` (${t.count})` : ""}
          </button>
        ))}
      </div>

      {/* ── TAB: SESIONES ── */}
      {tab === "sesiones" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0D1E3A" }}>Sesiones registradas</h3>
            {canEdit && (
              <button onClick={() => setShowSession(true)} style={btnPrimary}>+ Registrar sesión</button>
            )}
          </div>

          {/* Salud — contexto clínico relevante para el seguimiento */}
          {student.healthRecord && (student.healthRecord.bloodType || hasHealthNote(student.healthRecord.allergies) || hasHealthNote(student.healthRecord.conditions) || hasHealthNote(student.healthRecord.medications)) && (
            <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9f1239", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Salud</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 13, color: "#374151" }}>
                {student.healthRecord.bloodType && (
                  <div><span style={{ color: "#9f1239", fontWeight: 600 }}>Sangre:</span> {student.healthRecord.bloodType}</div>
                )}
                {hasHealthNote(student.healthRecord.allergies) && (
                  <div><span style={{ color: "#9f1239", fontWeight: 600 }}>Alergias / condiciones:</span> {student.healthRecord.allergies}</div>
                )}
                {hasHealthNote(student.healthRecord.conditions) && (
                  <div><span style={{ color: "#9f1239", fontWeight: 600 }}>Antecedentes:</span> {student.healthRecord.conditions}</div>
                )}
                {hasHealthNote(student.healthRecord.medications) && (
                  <div><span style={{ color: "#9f1239", fontWeight: 600 }}>Medicación:</span> {student.healthRecord.medications}</div>
                )}
              </div>
            </div>
          )}

          {/* Grades quick view */}
          {student.gradeRecords.length > 0 && (
            <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Notas del alumno</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Array.from(new Set(student.gradeRecords.map(g => g.course.name))).slice(0, 8).map(course => {
                  const records = student.gradeRecords.filter(g => g.course.name === course)
                  const latest = records[records.length - 1]
                  const grade = latest?.finalGrade ?? null
                  return (
                    <div key={course} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 10px", fontSize: 12 }}>
                      <div style={{ fontWeight: 600, color: "#374151" }}>{course}</div>
                      <div style={{ color: grade !== null && grade < 11 ? "#dc2626" : "#16a34a", fontWeight: 700 }}>
                        {grade !== null ? grade : latest?.qualitative ?? "—"}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Incidents quick view */}
          {student.incidents.length > 0 && (
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#9a3412", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Conducta — últimos registros</div>
              {student.incidents.slice(0, 3).map(inc => (
                <div key={inc.id} style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
                  <span style={{ color: "#9a3412", fontWeight: 600 }}>{new Date(inc.date).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}</span>
                  {" · "}{inc.title ?? inc.description.slice(0, 60)}
                </div>
              ))}
            </div>
          )}

          {caso.sessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", border: "1px dashed #e5e7eb", borderRadius: 12 }}>
              No hay sesiones registradas aún
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {caso.sessions.map(s => (
                <div key={s.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0D1E3A" }}>
                        {new Date(s.date).toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                        <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: "#6b7280" }}>· {SESSION_TYPE[s.type] ?? s.type}</span>
                      </div>
                      <p style={{ margin: "6px 0 0", fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{s.summary}</p>
                      {s.nextDate && (
                        <div style={{ marginTop: 6, fontSize: 12, color: "#0369a1" }}>
                          📅 Próxima cita: {new Date(s.nextDate).toLocaleDateString("es-PE", { day: "2-digit", month: "long" })}
                        </div>
                      )}
                    </div>
                    {canEdit && (
                      <button onClick={() => deleteSession(s.id)} style={{ fontSize: 12, color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 4 }}>✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: PLAN ── */}
      {tab === "plan" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0D1E3A" }}>Plan de Intervención</h3>
            {canEdit && !planEdit && (
              <button onClick={() => setPlanEdit(true)} style={btnSecondary}>Editar plan</button>
            )}
          </div>

          {!caso.plan && !planEdit ? (
            <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", border: "1px dashed #e5e7eb", borderRadius: 12 }}>
              No hay plan creado.{canEdit && " Haz clic en \"Editar plan\" para crear uno."}
            </div>
          ) : planEdit ? (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}>
              <label style={labelStyle}>Estado del plan</label>
              <select value={planStatus} onChange={e => setPlanStatus(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }}>
                <option value="en_proceso">En proceso</option>
                <option value="completado">Completado</option>
                <option value="suspendido">Suspendido</option>
              </select>

              <label style={labelStyle}>Objetivos</label>
              {objectives.map((obj, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input value={obj} onChange={e => setObjectives(o => o.map((x, j) => j === i ? e.target.value : x))}
                    style={{ ...inputStyle, flex: 1 }} placeholder={`Objetivo ${i + 1}`} />
                  <button onClick={() => setObjectives(o => o.filter((_, j) => j !== i))}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #fecaca", background: "#fee2e2", color: "#dc2626", cursor: "pointer", fontWeight: 700 }}>✕</button>
                </div>
              ))}
              <button onClick={() => setObjectives(o => [...o, ""])} style={{ ...btnSecondary, marginBottom: 16 }}>+ Agregar objetivo</button>

              <label style={labelStyle}>Estrategias</label>
              {strategies.map((str, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input value={str} onChange={e => setStrategies(s => s.map((x, j) => j === i ? e.target.value : x))}
                    style={{ ...inputStyle, flex: 1 }} placeholder={`Estrategia ${i + 1}`} />
                  <button onClick={() => setStrategies(s => s.filter((_, j) => j !== i))}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #fecaca", background: "#fee2e2", color: "#dc2626", cursor: "pointer", fontWeight: 700 }}>✕</button>
                </div>
              ))}
              <button onClick={() => setStrategies(s => [...s, ""])} style={{ ...btnSecondary, marginBottom: 20 }}>+ Agregar estrategia</button>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setPlanEdit(false)} style={btnSecondary}>Cancelar</button>
                <button onClick={savePlan} disabled={savingPlan} style={btnPrimary}>{savingPlan ? "Guardando..." : "Guardar plan"}</button>
              </div>
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20 }}>
              <div style={{ marginBottom: 16 }}>
                <span style={{
                  display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  background: caso.plan?.status === "completado" ? "#dcfce7" : caso.plan?.status === "suspendido" ? "#fee2e2" : "#fef3c7",
                  color: caso.plan?.status === "completado" ? "#16a34a" : caso.plan?.status === "suspendido" ? "#dc2626" : "#92400e",
                }}>
                  {caso.plan?.status === "en_proceso" ? "En proceso" : caso.plan?.status === "completado" ? "Completado" : "Suspendido"}
                </span>
              </div>
              {objectives.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Objetivos</div>
                  {objectives.filter(o => o).map((obj, i) => (
                    <div key={i} style={{ fontSize: 14, color: "#374151", marginBottom: 6, display: "flex", gap: 8 }}>
                      <span style={{ color: "#0D1E3A", fontWeight: 700 }}>•</span> {obj}
                    </div>
                  ))}
                </div>
              )}
              {strategies.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Estrategias</div>
                  {strategies.filter(s => s).map((str, i) => (
                    <div key={i} style={{ fontSize: 14, color: "#374151", marginBottom: 6, display: "flex", gap: 8 }}>
                      <span style={{ color: "#0D1E3A", fontWeight: 700 }}>→</span> {str}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CONTACTOS ── */}
      {tab === "contactos" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0D1E3A" }}>Contactos con apoderado</h3>
            {canEdit && (
              <button onClick={() => setShowContact(true)} style={btnPrimary}>+ Registrar contacto</button>
            )}
          </div>

          {caso.contacts.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", border: "1px dashed #e5e7eb", borderRadius: 12 }}>
              No hay contactos registrados
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {caso.contacts.map(c => (
                <div key={c.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                      background: c.channel === "whatsapp" ? "#dcfce7" : "#f3f4f6",
                      color: c.channel === "whatsapp" ? "#16a34a" : "#374151",
                    }}>
                      {CHANNEL_LABEL[c.channel] ?? c.channel}
                    </span>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>
                      {new Date(c.contactedAt).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{c.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: INFORMES ── */}
      {tab === "informes" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0D1E3A" }}>Informes</h3>
            {canEdit && (
              <button onClick={() => setShowReport(true)} style={btnPrimary}>+ Subir informe</button>
            )}
          </div>

          {caso.reports.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#9ca3af", border: "1px dashed #e5e7eb", borderRadius: 12 }}>
              No hay informes subidos
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {caso.reports.map(r => (
                <div key={r.id} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 32, flexShrink: 0 }}>{r.fileType === "pdf" ? "📄" : "📝"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0D1E3A" }}>{r.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                      {REPORT_TYPE[r.type] ?? r.type} · Subido por {r.uploadedBy.name} · {new Date(r.uploadedAt).toLocaleDateString("es-PE")}
                    </div>
                  </div>
                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" style={{
                    padding: "8px 14px", borderRadius: 8, background: "#0D1E3A", color: "#fff",
                    fontSize: 13, fontWeight: 600, textDecoration: "none", flexShrink: 0,
                  }}>
                    Descargar
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* New session modal */}
      {showSession && (
        <Modal title="Registrar sesión" onClose={() => setShowSession(false)}>
          <form onSubmit={addSession}>
            <label style={labelStyle}>Fecha</label>
            <input type="date" value={sessionForm.date} onChange={e => setSessionForm(f => ({ ...f, date: e.target.value }))} required style={inputStyle} />
            <label style={{ ...labelStyle, marginTop: 14 }}>Tipo de sesión</label>
            <select value={sessionForm.type} onChange={e => setSessionForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
              <option value="individual">Individual</option>
              <option value="grupal">Grupal</option>
              <option value="con_apoderado">Con apoderado</option>
            </select>
            <label style={{ ...labelStyle, marginTop: 14 }}>Resumen de la sesión</label>
            <textarea value={sessionForm.summary} onChange={e => setSessionForm(f => ({ ...f, summary: e.target.value }))}
              required rows={4} placeholder="Describe lo trabajado en la sesión..." style={{ ...inputStyle, resize: "vertical" }} />
            <label style={{ ...labelStyle, marginTop: 14 }}>Próxima cita (opcional)</label>
            <input type="date" value={sessionForm.nextDate} onChange={e => setSessionForm(f => ({ ...f, nextDate: e.target.value }))} style={inputStyle} />
            <ModalActions onCancel={() => setShowSession(false)} saving={savingSession} label="Guardar sesión" />
          </form>
        </Modal>
      )}

      {/* New contact modal */}
      {showContact && (
        <Modal title="Registrar contacto con apoderado" onClose={() => setShowContact(false)}>
          <form onSubmit={addContact}>
            <label style={labelStyle}>Canal de contacto</label>
            <select value={contactForm.channel} onChange={e => setContactForm(f => ({ ...f, channel: e.target.value }))} style={inputStyle}>
              <option value="whatsapp">WhatsApp</option>
              <option value="llamada">Llamada telefónica</option>
              <option value="presencial">Reunión presencial</option>
              <option value="mensaje">Mensaje interno</option>
            </select>
            <label style={{ ...labelStyle, marginTop: 14 }}>Resumen del contacto</label>
            <textarea value={contactForm.summary} onChange={e => setContactForm(f => ({ ...f, summary: e.target.value }))}
              required rows={4} placeholder="¿De qué se trató el contacto? ¿Qué acuerdos se tomaron?" style={{ ...inputStyle, resize: "vertical" }} />
            <ModalActions onCancel={() => setShowContact(false)} saving={savingContact} label="Registrar" />
          </form>
        </Modal>
      )}

      {/* Upload report modal */}
      {showReport && (
        <Modal title="Subir informe" onClose={() => setShowReport(false)}>
          <form onSubmit={uploadReport}>
            <label style={labelStyle}>Archivo (PDF o Word)</label>
            <input type="file" accept=".pdf,.doc,.docx" required
              onChange={e => { const f = e.target.files?.[0] ?? null; setReportFile(f); if (f && !reportName) setReportName(f.name.replace(/\.[^.]+$/, "")) }}
              style={{ ...inputStyle, padding: "8px" }} />
            <label style={{ ...labelStyle, marginTop: 14 }}>Nombre del informe</label>
            <input value={reportName} onChange={e => setReportName(e.target.value)} placeholder="Ej: Informe diagnóstico inicial" style={inputStyle} />
            <label style={{ ...labelStyle, marginTop: 14 }}>Tipo de informe</label>
            <select value={reportType} onChange={e => setReportType(e.target.value)} style={inputStyle}>
              <option value="diagnostico">Diagnóstico</option>
              <option value="evolucion">Evolución</option>
              <option value="cierre">Cierre de caso</option>
            </select>
            <ModalActions onCancel={() => setShowReport(false)} saving={uploadingReport} label={uploadingReport ? "Subiendo..." : "Subir informe"} />
          </form>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: "#0D1E3A", marginTop: 0, marginBottom: 20 }}>{title}</h2>
        {children}
      </div>
    </div>
  )
}

function ModalActions({ onCancel, saving, label }: { onCancel: () => void; saving: boolean; label: string }) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
      <button type="button" onClick={onCancel} style={btnSecondary}>Cancelar</button>
      <button type="submit" disabled={saving} style={btnPrimary}>{label}</button>
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
