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

const STATUS_ABBR: Record<string, string> = { present: "A", late: "T", absent: "F" }
const MESES_ES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SETIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]
const MES_ALIASES: Record<string, number> = {}
MESES_ES.forEach((m, i) => { MES_ALIASES[m] = i + 1 })
MES_ALIASES["SEPTIEMBRE"] = 9
const WEEKDAY_LETTERS = ["L", "M", "M", "J", "V"]

type TemplateBlock = { year: number; month: number; days: number[]; students: { name: string; marks: (string | null)[] }[] }
type ReportSection = { id: string; name: string; students: { studentName: string; days: Record<string, string>; present: number; late: number; absent: number; marked: number }[] }
type ConsolidadoSection = { id: string; name: string; students: { studentId: string; studentName: string; present: number; late: number; absent: number; marked: number; pct: number }[] }

function parseTemplate(rows: unknown[][], defaultYear: number): TemplateBlock[] {
  const blocks: TemplateBlock[] = []
  let year = defaultYear
  for (let r = 0; r < Math.min(rows.length, 6); r++) {
    for (const cell of rows[r] ?? []) {
      if (typeof cell === "string") {
        const m = cell.match(/(20\d{2})/)
        if (m) { year = parseInt(m[1]); break }
      }
    }
  }

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r] ?? []
    if (String(row[1] ?? "").trim().toUpperCase() !== "APELLIDOS Y NOMBRES") continue

    const mesRow = rows[r - 2] ?? []
    const mesCell = String(mesRow[0] ?? "").toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    const mesMatch = mesCell.match(/MES\s*:?\s*([A-Z]+)/)
    const month = mesMatch ? (MES_ALIASES[mesMatch[1]] ?? 1) : 1

    const days: number[] = []
    const dayCols: number[] = []
    let emptyStreak = 0
    for (let c = 2; c < row.length; c++) {
      const v = row[c]
      if (typeof v === "number" && v >= 1 && v <= 31) {
        days.push(v); dayCols.push(c); emptyStreak = 0
      } else {
        emptyStreak++
        if (emptyStreak >= 3 && days.length > 0) break
      }
    }
    if (days.length === 0) continue

    const students: { name: string; marks: (string | null)[] }[] = []
    let rr = r + 1
    let blankStreak = 0
    while (rr < rows.length) {
      const srow = rows[rr] ?? []
      if (String(srow[1] ?? "").trim().toUpperCase() === "APELLIDOS Y NOMBRES") break
      if (String(srow[0] ?? "").toUpperCase().startsWith("MES")) break
      const name = String(srow[1] ?? "").trim()
      if (!name) {
        blankStreak++
        if (blankStreak >= 2) break
      } else {
        blankStreak = 0
        students.push({ name, marks: dayCols.map(c => (srow[c] != null ? String(srow[c]).trim() : null)) })
      }
      rr++
    }
    if (students.length > 0) blocks.push({ year, month, days, students })
  }
  return blocks
}

export default function AsistenciaPage() {
  const [tab, setTab] = useState<"marcar" | "qr" | "escaneo" | "reporte">("marcar")
  // reporte
  const [reportMonth, setReportMonth] = useState(thisMonth())
  const [reportSectionId, setReportSectionId] = useState("all")
  const [downloading, setDownloading] = useState(false)
  const [reportPreview, setReportPreview] = useState<{ daysInMonth: number; sections: ReportSection[] } | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  // historial / consolidado anual
  const [consolidadoYear, setConsolidadoYear] = useState(new Date().getFullYear())
  const [consolidadoSectionId, setConsolidadoSectionId] = useState("all")
  const [consolidadoData, setConsolidadoData] = useState<{ year: number; sections: ConsolidadoSection[] } | null>(null)
  const [loadingConsolidado, setLoadingConsolidado] = useState(false)
  const [downloadingConsolidado, setDownloadingConsolidado] = useState(false)
  // cargar plantilla propia
  const [uploadSectionId, setUploadSectionId] = useState("")
  const [uploadYear, setUploadYear] = useState(new Date().getFullYear())
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ written: number; unmatched: string[] } | null>(null)
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

  async function loadPreview() {
    setLoadingPreview(true)
    try {
      const data = await fetch(`/api/asistencia/reporte?month=${reportMonth}&sectionId=${reportSectionId}`).then(r => r.json())
      setReportPreview({ daysInMonth: data.daysInMonth, sections: data.sections ?? [] })
    } finally {
      setLoadingPreview(false)
    }
  }

  async function loadConsolidado() {
    setLoadingConsolidado(true)
    try {
      const data = await fetch(`/api/asistencia/consolidado?year=${consolidadoYear}&sectionId=${consolidadoSectionId}`).then(r => r.json())
      setConsolidadoData({ year: data.year, sections: data.sections ?? [] })
    } finally {
      setLoadingConsolidado(false)
    }
  }

  async function downloadConsolidado() {
    setDownloadingConsolidado(true)
    try {
      const data = consolidadoData ?? await fetch(`/api/asistencia/consolidado?year=${consolidadoYear}&sectionId=${consolidadoSectionId}`).then(r => r.json())
      const secs: ConsolidadoSection[] = data.sections ?? []
      if (secs.length === 0) {
        setToast("No hay alumnos para el filtro seleccionado")
        setTimeout(() => setToast(""), 2500)
        return
      }
      const wb = XLSX.utils.book_new()
      for (const sec of secs) {
        const header = ["N°", "Apellidos y Nombres", "Presente", "Tarde", "Ausente", "% Asistencia"]
        const aoa: (string | number)[][] = [header]
        sec.students.forEach((s, i) => aoa.push([i + 1, s.studentName, s.present, s.late, s.absent, `${s.pct}%`]))
        const ws = XLSX.utils.aoa_to_sheet(aoa)
        ws["!cols"] = [{ wch: 4 }, { wch: 30 }, { wch: 9 }, { wch: 7 }, { wch: 8 }, { wch: 11 }]
        const sheetName = sec.name.replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Aula"
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      }
      XLSX.writeFile(wb, `consolidado_asistencia_${consolidadoYear}.xlsx`)
    } finally {
      setDownloadingConsolidado(false)
    }
  }

  async function downloadReport() {
    setDownloading(true)
    try {
      const [yearStr, monthStr] = reportMonth.split("-")
      const year = parseInt(yearStr)
      const month = parseInt(monthStr)
      const daysInMonthLocal = new Date(year, month, 0).getDate()

      const data = await fetch(`/api/asistencia/reporte?month=${reportMonth}&sectionId=${reportSectionId}`).then(r => r.json())
      const sections: ReportSection[] = data.sections ?? []

      if (sections.length === 0) {
        setToast("No hay alumnos para el filtro seleccionado")
        setTimeout(() => setToast(""), 2500)
        return
      }

      // Agrupa los días hábiles (lun-vie) del mes en semanas de 5
      const weeks: number[][] = []
      let current: number[] = []
      for (let d = 1; d <= daysInMonthLocal; d++) {
        const dow = new Date(year, month - 1, d).getDay() // 0=dom..6=sab
        if (dow >= 1 && dow <= 5) {
          current.push(d)
          if (current.length === 5) { weeks.push(current); current = [] }
        }
      }
      if (current.length > 0) weeks.push(current)
      const totalSlots = weeks.length * 5
      const dayCol0 = 2 // columna C (0-indexed)
      const summaryCol0 = dayCol0 + totalSlots

      const wb = XLSX.utils.book_new()
      for (const sec of sections) {
        const aoa: (string | number)[][] = Array.from({ length: 7 }, () => [])
        const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = []

        // Fila 1 (0): vacía
        aoa[0] = []
        // Fila 2 (1): título + encabezados de resumen
        aoa[1] = new Array(summaryCol0 + 6).fill("")
        aoa[1][2] = `REGISTRO DE ASISTENCIA ${year}`
        ;["ASISTENCIA", "TARDANZAS", "T.JUSTIFICADA", "FALTAS", "F.JUSTIFICADA", "% ASISTENCIA"].forEach((h, i) => { aoa[1][summaryCol0 + i] = h })
        merges.push({ s: { r: 1, c: 2 }, e: { r: 1, c: dayCol0 + totalSlots - 1 } })
        for (let i = 0; i < 6; i++) merges.push({ s: { r: 1, c: summaryCol0 + i }, e: { r: 6, c: summaryCol0 + i } })

        // Fila 3 (2): nivel / aula
        aoa[2] = []
        aoa[2][2] = ` NIVEL:                                                                    AULA: ${sec.name} `
        // Fila 4 (3): tutor
        aoa[3] = []
        aoa[3][2] = "TUTOR (A):  "
        // Fila 5 (4): "MES : X" + "SEMANA n"
        aoa[4] = []
        aoa[4][0] = `MES :  ${MESES_ES[month - 1]}`
        weeks.forEach((_, wi) => {
          const c0 = dayCol0 + wi * 5
          aoa[4][c0] = `SEMANA ${wi + 1}`
          merges.push({ s: { r: 4, c: c0 }, e: { r: 4, c: c0 + 4 } })
        })
        // Fila 6 (5): letras L M M J V
        aoa[5] = []
        weeks.forEach((week, wi) => {
          week.forEach((_, di) => { aoa[5][dayCol0 + wi * 5 + di] = WEEKDAY_LETTERS[di] })
        })
        // Fila 7 (6): N° / Apellidos y Nombres / números de día
        aoa[6] = []
        aoa[6][0] = "N°"
        aoa[6][1] = "APELLIDOS Y NOMBRES"
        weeks.forEach((week, wi) => {
          week.forEach((d, di) => { aoa[6][dayCol0 + wi * 5 + di] = d })
        })

        sec.students.forEach((s, i) => {
          const row: (string | number)[] = []
          row[0] = i + 1
          row[1] = s.studentName
          weeks.forEach((week, wi) => {
            week.forEach((d, di) => { row[dayCol0 + wi * 5 + di] = STATUS_ABBR[s.days[d]] ?? "" })
          })
          const pct = s.marked > 0 ? Math.round(((s.present + s.late) / s.marked) * 100) : 0
          row[summaryCol0] = s.present
          row[summaryCol0 + 1] = s.late
          row[summaryCol0 + 2] = 0
          row[summaryCol0 + 3] = s.absent
          row[summaryCol0 + 4] = 0
          row[summaryCol0 + 5] = `${pct}%`
          aoa.push(row)
        })

        const ws = XLSX.utils.aoa_to_sheet(aoa)
        ws["!merges"] = merges
        ws["!cols"] = [{ wch: 4 }, { wch: 30 }, ...Array.from({ length: totalSlots }, () => ({ wch: 3 })), { wch: 9 }, { wch: 9 }, { wch: 12 }, { wch: 7 }, { wch: 12 }, { wch: 11 }]
        const sheetName = sec.name.replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Aula"
        XLSX.utils.book_append_sheet(wb, ws, sheetName)
      }
      XLSX.writeFile(wb, `asistencia_${reportMonth}.xlsx`)
    } finally {
      setDownloading(false)
    }
  }

  function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!uploadSectionId) {
      setToast("Selecciona primero el aula")
      setTimeout(() => setToast(""), 2500)
      e.target.value = ""
      return
    }
    setUploading(true)
    setUploadResult(null)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: "array" })
      let allBlocks: TemplateBlock[] = []
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName]
        const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true }) as unknown[][]
        allBlocks = allBlocks.concat(parseTemplate(sheetRows, uploadYear))
      }
      if (allBlocks.length === 0) {
        setUploading(false)
        setToast("No se reconoció el formato de la plantilla")
        setTimeout(() => setToast(""), 3000)
        return
      }
      const res = await fetch("/api/asistencia/importar-plantilla", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId: uploadSectionId, blocks: allBlocks }),
      }).then(r => r.json())
      setUploading(false)
      setUploadResult(res)
      e.target.value = ""
    }
    reader.readAsArrayBuffer(file)
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
            Descarga la asistencia del mes en Excel con tu mismo formato: semanas, días L-M-M-J-V y columnas de resumen, una hoja por aula.
          </p>
          <div className="flex flex-wrap gap-3 mb-3">
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
            <div className="flex items-end gap-2">
              <button onClick={loadPreview} disabled={loadingPreview} className="px-4 py-2.5 rounded-lg border text-sm font-semibold hover:bg-primary-50 hover:text-primary-600 transition-colors disabled:opacity-60" style={{ borderColor: "var(--border)", color: "var(--fg)" }}>
                {loadingPreview ? "Cargando..." : "👁 Ver en pantalla"}
              </button>
              <button onClick={downloadReport} disabled={downloading} className="px-5 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">
                {downloading ? "Generando..." : "⬇ Descargar Excel"}
              </button>
            </div>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>A = Asistió · T = Tarde · F = Falta · celda vacía = sin marcar ese día.</p>

          {reportPreview && (
            <div className="mb-8 space-y-6">
              {reportPreview.sections.length === 0 && (
                <p className="text-sm" style={{ color: "var(--muted)" }}>No hay alumnos para el filtro seleccionado.</p>
              )}
              {reportPreview.sections.map(sec => (
                <div key={sec.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  <div className="px-4 py-2 text-sm font-bold" style={{ background: "var(--surface)", color: "var(--fg)" }}>{sec.name}</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "var(--surface)" }}>
                          <th className="px-2 py-1.5 text-left" style={{ color: "var(--muted)" }}>Alumno</th>
                          {Array.from({ length: reportPreview.daysInMonth }, (_, i) => (
                            <th key={i} className="px-1 py-1.5 text-center" style={{ color: "var(--muted)" }}>{i + 1}</th>
                          ))}
                          <th className="px-2 py-1.5 text-center" style={{ color: "var(--muted)" }}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sec.students.map((s, i) => {
                          const pct = s.marked > 0 ? Math.round(((s.present + s.late) / s.marked) * 100) : 0
                          return (
                            <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                              <td className="px-2 py-1 whitespace-nowrap" style={{ color: "var(--fg)" }}>{s.studentName}</td>
                              {Array.from({ length: reportPreview.daysInMonth }, (_, d) => {
                                const st = s.days[d + 1]
                                const abbr = STATUS_ABBR[st] ?? ""
                                const color = st === "absent" ? "#dc2626" : st === "late" ? "#d97706" : st === "present" ? "#16a34a" : "var(--muted)"
                                return <td key={d} className="px-1 py-1 text-center font-medium" style={{ color }}>{abbr}</td>
                              })}
                              <td className="px-2 py-1 text-center font-semibold" style={{ color: "var(--fg)" }}>{pct}%</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border p-5 mb-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: "var(--fg)" }}>Historial / Consolidado anual</h3>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
              Totales de asistencia del año completo por alumno — para ver el historial acumulado en cualquier momento, sin depender del Excel.
            </p>
            <div className="flex flex-wrap gap-3 items-end mb-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Año</label>
                <input type="number" value={consolidadoYear} onChange={e => setConsolidadoYear(parseInt(e.target.value) || consolidadoYear)}
                  className="w-24 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Aula</label>
                <select value={consolidadoSectionId} onChange={e => setConsolidadoSectionId(e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                  <option value="all">Todas las aulas</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button onClick={loadConsolidado} disabled={loadingConsolidado} className="px-4 py-2.5 rounded-lg border text-sm font-semibold hover:bg-primary-50 hover:text-primary-600 transition-colors disabled:opacity-60" style={{ borderColor: "var(--border)", color: "var(--fg)" }}>
                {loadingConsolidado ? "Cargando..." : "👁 Ver consolidado"}
              </button>
              <button onClick={downloadConsolidado} disabled={downloadingConsolidado} className="px-4 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">
                {downloadingConsolidado ? "Generando..." : "⬇ Descargar Excel"}
              </button>
            </div>

            {consolidadoData && (
              <div className="space-y-6 mt-4">
                {consolidadoData.sections.length === 0 && (
                  <p className="text-sm" style={{ color: "var(--muted)" }}>No hay alumnos para el filtro seleccionado.</p>
                )}
                {consolidadoData.sections.map(sec => (
                  <div key={sec.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                    <div className="px-4 py-2 text-sm font-bold" style={{ background: "var(--bg)", color: "var(--fg)" }}>{sec.name}</div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "var(--bg)" }}>
                          <th className="px-3 py-1.5 text-left" style={{ color: "var(--muted)" }}>#</th>
                          <th className="px-3 py-1.5 text-left" style={{ color: "var(--muted)" }}>Alumno</th>
                          <th className="px-3 py-1.5 text-center text-green-600">Presente</th>
                          <th className="px-3 py-1.5 text-center text-amber-600">Tarde</th>
                          <th className="px-3 py-1.5 text-center text-red-600">Ausente</th>
                          <th className="px-3 py-1.5 text-center" style={{ color: "var(--muted)" }}>% Asistencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sec.students.map((s, i) => (
                          <tr key={s.studentId} className="border-t" style={{ borderColor: "var(--border)" }}>
                            <td className="px-3 py-1.5" style={{ color: "var(--muted)" }}>{i + 1}</td>
                            <td className="px-3 py-1.5" style={{ color: "var(--fg)" }}>{s.studentName}</td>
                            <td className="px-3 py-1.5 text-center font-semibold text-green-600">{s.present}</td>
                            <td className="px-3 py-1.5 text-center font-semibold text-amber-600">{s.late}</td>
                            <td className="px-3 py-1.5 text-center font-semibold text-red-600">{s.absent}</td>
                            <td className="px-3 py-1.5 text-center font-bold" style={{ color: "var(--fg)" }}>{s.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: "var(--fg)" }}>Cargar tu plantilla de asistencia</h3>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
              Sube un Excel con tu propio formato (como &quot;REGISTRO ASISTENCIA-2026 CR.xlsx&quot;). Detecta automáticamente todos los meses que tenga la hoja y registra la asistencia de cada alumno del aula que elijas.
            </p>
            <div className="flex flex-wrap gap-3 items-end mb-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Aula destino</label>
                <select value={uploadSectionId} onChange={e => setUploadSectionId(e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                  <option value="">Selecciona...</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Año (si tu plantilla no lo indica)</label>
                <input type="number" value={uploadYear} onChange={e => setUploadYear(parseInt(e.target.value) || uploadYear)}
                  className="w-24 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
              </div>
              <label className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${uploading ? "opacity-60 pointer-events-none" : ""}`} style={{ border: "1px solid var(--border)", color: "var(--fg)" }}>
                {uploading ? "Procesando..." : "Seleccionar archivo"}
                <input type="file" accept=".xlsx,.xls" onChange={handleUploadFile} className="hidden" disabled={uploading} />
              </label>
            </div>

            {uploadResult && (
              <div className="rounded-lg border p-3 mt-2" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
                <p className="text-sm font-semibold text-green-600">✓ {uploadResult.written} registros de asistencia guardados</p>
                {uploadResult.unmatched.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-amber-600">{uploadResult.unmatched.length} nombres no coincidieron con alumnos de esta aula:</p>
                    <ul className="text-xs mt-1 space-y-0.5 max-h-32 overflow-y-auto" style={{ color: "var(--muted)" }}>
                      {uploadResult.unmatched.map((n, i) => <li key={i}>• {n}</li>)}
                    </ul>
                    <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Revisa que el nombre en la plantilla coincida con &quot;Apellidos, Nombres&quot; tal como está registrado el alumno.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
