"use client"

import { useState, useEffect, useCallback } from "react"
import { QRCodeSVG } from "qrcode.react"
import dynamic from "next/dynamic"
import * as XLSX from "xlsx"
import BackButton from "@/components/BackButton"

const QrScanner = dynamic(() => import("@/components/QrScanner"), { ssr: false })

type Section = { id: string; name: string }
type Row = { studentId: string; studentName: string; status: string }
type QrRow = { studentId: string; studentName: string; qrData: string }

const STATUSES = [
  { key: "present", label: "Presente", color: "bg-green-500", text: "text-green-600", bg: "bg-green-50" },
  { key: "late", label: "Tarde", color: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" },
  { key: "absent", label: "Ausente", color: "bg-red-500", text: "text-red-600", bg: "bg-red-50" },
]

function today() { return new Date().toISOString().slice(0, 10) }
function thisMonth() { return new Date().toISOString().slice(0, 7) }

const STATUS_ABBR: Record<string, string> = { present: "P", late: "T", absent: "F" }

export default function AsistenciaPage() {
  const [tab, setTab] = useState<"marcar" | "qr" | "escaneo" | "reporte">("marcar")
  // reporte
  const [reportMonth, setReportMonth] = useState(thisMonth())
  const [reportSectionId, setReportSectionId] = useState("all")
  const [downloading, setDownloading] = useState(false)
  // escaneo
  const [scanInput, setScanInput] = useState("")
  const [scanMode, setScanMode] = useState<"entry" | "exit">("entry")
  const [useCamera, setUseCamera] = useState(false)
  const [scanResults, setScanResults] = useState<{ name: string; section: string; mode: string; time: string; status: string; waLink: string | null; notify: boolean }[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [sectionId, setSectionId] = useState("")
  const [date, setDate] = useState(today())
  const [rows, setRows] = useState<Row[]>([])
  const [qrRows, setQrRows] = useState<QrRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState("")

  useEffect(() => {
    fetch("/api/secciones").then(r => r.json()).then((s: Section[]) => {
      setSections(s)
      if (s[0]) setSectionId(s[0].id)
    })
  }, [])

  const loadMarcar = useCallback(async () => {
    if (!sectionId) return
    setLoading(true)
    const data = await fetch(`/api/asistencia?sectionId=${sectionId}&date=${date}`).then(r => r.json())
    setRows(data.rows ?? [])
    setLoading(false)
  }, [sectionId, date])

  const loadQr = useCallback(async () => {
    if (!sectionId) return
    const data = await fetch(`/api/asistencia/qr?sectionId=${sectionId}`).then(r => r.json())
    setQrRows(data.rows ?? [])
  }, [sectionId])

  useEffect(() => { if (tab === "marcar") loadMarcar() }, [tab, loadMarcar])
  useEffect(() => { if (tab === "qr") loadQr() }, [tab, loadQr])

  function setStatus(studentId: string, status: string) {
    setRows(rs => rs.map(r => r.studentId === studentId ? { ...r, status } : r))
  }
  function markAll(status: string) {
    setRows(rs => rs.map(r => ({ ...r, status })))
  }

  async function save() {
    setSaving(true)
    await fetch("/api/asistencia", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId, date, records: rows.map(r => ({ studentId: r.studentId, status: r.status })) }),
    })
    setSaving(false)
    setToast("Asistencia guardada ✓")
    setTimeout(() => setToast(""), 2500)
  }

  const counts = {
    present: rows.filter(r => r.status === "present").length,
    late: rows.filter(r => r.status === "late").length,
    absent: rows.filter(r => r.status === "absent").length,
  }

  async function downloadReport() {
    setDownloading(true)
    try {
      const data = await fetch(`/api/asistencia/reporte?month=${reportMonth}&sectionId=${reportSectionId}`).then(r => r.json())
      const daysInMonth: number = data.daysInMonth
      const sections: { id: string; name: string; students: { studentName: string; days: Record<string, string>; present: number; late: number; absent: number; marked: number }[] }[] = data.sections ?? []

      if (sections.length === 0) {
        setToast("No hay alumnos para el filtro seleccionado")
        setTimeout(() => setToast(""), 2500)
        return
      }

      const wb = XLSX.utils.book_new()
      for (const sec of sections) {
        const header = ["N°", "Apellidos y Nombres", ...Array.from({ length: daysInMonth }, (_, i) => String(i + 1)), "Presente", "Tarde", "Ausente", "% Asistencia"]
        const aoa: (string | number)[][] = [header]
        sec.students.forEach((s, i) => {
          const dayCells = Array.from({ length: daysInMonth }, (_, d) => STATUS_ABBR[s.days[d + 1]] ?? "")
          const pct = s.marked > 0 ? Math.round(((s.present + s.late) / s.marked) * 100) : 0
          aoa.push([i + 1, s.studentName, ...dayCells, s.present, s.late, s.absent, `${pct}%`])
        })
        const ws = XLSX.utils.aoa_to_sheet(aoa)
        ws["!cols"] = [{ wch: 4 }, { wch: 30 }, ...Array.from({ length: daysInMonth }, () => ({ wch: 3 })), { wch: 9 }, { wch: 7 }, { wch: 8 }, { wch: 11 }]
        const sheetName = sec.name.replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Aula"
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      }
      XLSX.writeFile(wb, `asistencia_${reportMonth}.xlsx`)
    } finally {
      setDownloading(false)
    }
  }

  async function doScan(qrData: string) {
    const code = qrData.trim()
    if (!code) return
    const res = await fetch("/api/asistencia/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qrData: code, mode: scanMode }) })
    const data = await res.json()
    setScanInput("")
    if (!res.ok) { setScanResults(r => [{ name: data.error ?? "Error", section: "", mode: scanMode, time: "", status: "error", waLink: null, notify: false }, ...r]); return }
    setScanResults(r => [{ name: data.studentName, section: data.section, mode: data.mode, time: data.time, status: data.status, waLink: data.waLink, notify: data.notify }, ...r].slice(0, 20))
    if (data.notify && data.waLink) window.open(data.waLink, "_blank")
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {toast && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium shadow-lg">{toast}</div>}

      <div className="print:hidden"><BackButton href="/dashboard/academico" /></div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--fg)" }}>Asistencia</h1>
      <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>Control diario, escaneo QR con ingreso/salida y notificación al apoderado</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 print:hidden flex-wrap">
        {[{ k: "marcar", l: "Marcar asistencia" }, { k: "escaneo", l: "Escaneo QR" }, { k: "qr", l: "Códigos QR" }, { k: "reporte", l: "Reporte / Descargar" }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as "marcar" | "qr" | "escaneo" | "reporte")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.k ? "bg-primary-500 text-white" : "border"}`}
            style={tab === t.k ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Controls */}
      {tab !== "reporte" && (
        <div className="flex flex-wrap gap-3 mb-5 print:hidden">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Sección</label>
            <select value={sectionId} onChange={e => setSectionId(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
              style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}>
              {sections.length === 0 && <option value="">Sin secciones</option>}
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {tab === "marcar" && (
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Fecha</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }} />
            </div>
          )}
        </div>
      )}

      {/* MARCAR */}
      {tab === "marcar" && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex gap-2 text-xs">
              <span className="text-green-600 font-medium">● {counts.present} presentes</span>
              <span className="text-amber-600 font-medium">● {counts.late} tarde</span>
              <span className="text-red-600 font-medium">● {counts.absent} ausentes</span>
            </div>
            <button onClick={() => markAll("present")} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-green-50 hover:text-green-600 transition-colors ml-auto" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              Marcar todos presente
            </button>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {loading && <p className="text-center py-10 text-sm" style={{ color: "var(--muted)" }}>Cargando...</p>}
            {!loading && rows.length === 0 && <p className="text-center py-10 text-sm" style={{ color: "var(--muted)" }}>No hay alumnos en esta sección</p>}
            {!loading && rows.map((r, i) => (
              <div key={r.studentId} className="flex items-center justify-between px-4 py-2.5 border-t first:border-t-0" style={{ borderColor: "var(--border)" }}>
                <span className="text-sm font-medium" style={{ color: "var(--fg)" }}>{i + 1}. {r.studentName}</span>
                <div className="flex gap-1">
                  {STATUSES.map(s => (
                    <button key={s.key} onClick={() => setStatus(r.studentId, s.key)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${r.status === s.key ? `${s.color} text-white` : "border"}`}
                      style={r.status === s.key ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {rows.length > 0 && (
            <div className="flex justify-end mt-4">
              <button onClick={save} disabled={saving} className="px-6 py-2.5 rounded-lg bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 disabled:opacity-60">
                {saving ? "Guardando..." : "Guardar asistencia"}
              </button>
            </div>
          )}
        </>
      )}

      {/* ESCANEO */}
      {tab === "escaneo" && (
        <div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setScanMode("entry")} className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${scanMode === "entry" ? "bg-green-500 text-white" : "border"}`} style={scanMode === "entry" ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>🟢 Ingreso</button>
            <button onClick={() => setScanMode("exit")} className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${scanMode === "exit" ? "bg-primary-500 text-white" : "border"}`} style={scanMode === "exit" ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>🔵 Salida</button>
          </div>
          {/* Toggle cámara / manual */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setUseCamera(true)} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${useCamera ? "bg-primary-500 text-white" : "border"}`} style={useCamera ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>📷 Escanear con cámara</button>
            <button onClick={() => setUseCamera(false)} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${!useCamera ? "bg-primary-500 text-white" : "border"}`} style={!useCamera ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>⌨️ Ingreso manual</button>
          </div>

          {useCamera ? (
            <div className="mb-4">
              <QrScanner active={useCamera && tab === "escaneo"} onScan={(text) => doScan(text)} />
              <p className="text-center text-xs mt-2" style={{ color: "var(--muted)" }}>Modo <b>{scanMode === "entry" ? "Ingreso 🟢" : "Salida 🔵"}</b> · cambia arriba según corresponda</p>
            </div>
          ) : (
            <form onSubmit={e => { e.preventDefault(); doScan(scanInput) }} className="mb-4">
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Ingresa el código QR del alumno (formato CR-…)</label>
              <div className="flex gap-2">
                <input autoFocus value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="CR-xxxxx" className="flex-1 px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }} />
                <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600">Registrar</button>
              </div>
              <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>💡 Un lector de QR físico también funciona como teclado: enfoca este campo y escanea. La notificación automática al WhatsApp del apoderado se activa en Configuración.</p>
            </form>
          )}

          <div className="space-y-2">
            {scanResults.length === 0 && <p className="text-center py-8 text-sm" style={{ color: "var(--muted)" }}>Los registros aparecerán aquí</p>}
            {scanResults.map((r, i) => (
              <div key={i} className="rounded-xl border p-3 flex items-center gap-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                {r.status === "error" ? (
                  <span className="text-sm text-red-500">⚠️ {r.name}</span>
                ) : (
                  <>
                    <div className={`w-2.5 h-2.5 rounded-full ${r.mode === "entry" ? "bg-green-500" : "bg-primary-500"}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{r.name} <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>· {r.section}</span></p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>{r.mode === "entry" ? "Ingreso" : "Salida"} {r.time} {r.status === "late" && <span className="text-amber-600 font-medium">(Tarde)</span>}</p>
                    </div>
                    {r.waLink && <a href={r.waLink} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-lg bg-[#25D366] text-white hover:opacity-90">Avisar al padre</a>}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR */}
      {tab === "qr" && (
        <>
          <div className="flex justify-between items-center mb-4 print:hidden">
            <p className="text-sm" style={{ color: "var(--muted)" }}>{qrRows.length} códigos · imprime y pega en agendas o carnets</p>
            <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600">
              Imprimir
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {qrRows.map(q => (
              <div key={q.studentId} className="rounded-xl border p-3 flex flex-col items-center text-center" style={{ background: "white", borderColor: "var(--border)" }}>
                <QRCodeSVG value={q.qrData} size={110} level="M" />
                <p className="text-xs font-medium mt-2 text-black">{q.studentName}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* REPORTE */}
      {tab === "reporte" && (
        <div>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            Descarga la asistencia del mes en Excel: una hoja por aula, con cada alumno y su marca (P/T/F) día por día, más el % de asistencia.
          </p>
          <div className="flex flex-wrap gap-3 mb-5">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Mes</label>
              <input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Aula</label>
              <select value={reportSectionId} onChange={e => setReportSectionId(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}>
                <option value="all">Todas las aulas</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={downloadReport} disabled={downloading} className="px-5 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">
                {downloading ? "Generando..." : "⬇ Descargar Excel"}
              </button>
            </div>
          </div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>P = Presente · T = Tarde · F = Ausente · celda vacía = sin marcar ese día.</p>
        </div>
      )}
    </div>
  )
}
