"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { QRCodeSVG } from "qrcode.react"
import dynamic from "next/dynamic"
import * as XLSX from "xlsx"
import type ExcelJS from "exceljs"
import BackButton from "@/components/BackButton"

const QrScanner = dynamic(() => import("@/components/QrScanner"), { ssr: false })

type Section = { id: string; name: string }
type Row = { studentId: string; studentName: string; status: string; note?: string | null }
type QrRow = { studentId: string; studentName: string; qrData: string }

const STATUSES = [
  { key: "present", label: "Presente", color: "bg-green-500", text: "text-green-600", bg: "bg-green-50" },
  { key: "late", label: "Tarde", color: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" },
  { key: "absent", label: "Ausente", color: "bg-red-500", text: "text-red-600", bg: "bg-red-50" },
]

function today() { return new Date().toISOString().slice(0, 10) }
function thisMonth() { return new Date().toISOString().slice(0, 7) }

const STATUS_ABBR: Record<string, string> = { present: "A", late: "T", absent: "F" }
const STATUS_COLOR: Record<string, string> = { present: "#16a34a", late: "#d97706", absent: "#dc2626" }
const MESES_ES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SETIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"]
const MES_ALIASES: Record<string, number> = {}
MESES_ES.forEach((m, i) => { MES_ALIASES[m] = i + 1 })
MES_ALIASES["SEPTIEMBRE"] = 9

// Colores institucionales para el Excel
const XL_NAVY = "0D1E3A"
const XL_BLUE = "1A33CC"
const XL_LIGHT = "EEF2FF"
const XL_GREEN = "16A34A"
const XL_AMBER = "D97706"
const XL_RED = "DC2626"

type TemplateBlock = { year: number; month: number; days: number[]; students: { name: string; marks: (string | null)[] }[] }

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

// ── Tipos de la vista de historial ──────────────────────────────────────────
type VistaStudent = { studentId: string; studentName: string; marks: Record<string, string>; present: number; late: number; absent: number; marked: number; pct: number }
type VistaSection = { id: string; name: string; students: VistaStudent[] }
type VistaData = { dates: string[]; sections: VistaSection[] }

type BimestreCount = { present: number; late: number; absent: number; marked: number; pct: number }
type BimestreStudent = { studentId: string; studentName: string; b: BimestreCount[]; total: BimestreCount }
type BimestreSection = { id: string; name: string; students: BimestreStudent[] }
type BimestreData = { year: number; labels: string[]; sections: BimestreSection[] }

function fmtDate(iso: string) {
  const [, m, d] = iso.split("-")
  return `${d}/${m}`
}

export default function AsistenciaPage() {
  const [tab, setTab] = useState<"marcar" | "qr" | "escaneo" | "historial">("marcar")

  // ── historial (semana / mes / bimestre) ──
  const [scope, setScope] = useState<"semana" | "mes" | "bimestre">("semana")
  const [histSectionId, setHistSectionId] = useState("all")
  const [weekAnchor, setWeekAnchor] = useState(today())
  const [monthAnchor, setMonthAnchor] = useState(thisMonth())
  const [yearAnchor, setYearAnchor] = useState(new Date().getFullYear())
  const [vistaData, setVistaData] = useState<VistaData | null>(null)
  const [bimestreData, setBimestreData] = useState<BimestreData | null>(null)
  const [loadingHist, setLoadingHist] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // cargar plantilla propia
  const [uploadSectionId, setUploadSectionId] = useState("")
  const [uploadYear, setUploadYear] = useState(new Date().getFullYear())
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ written: number; unmatched: string[] } | null>(null)

  const [dirtyAsis, setDirtyAsis] = useState(false)
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // escaneo
  const [scanInput, setScanInput] = useState("")
  const [scanMode, setScanMode] = useState<"auto" | "entry" | "exit">("auto")
  const [useCamera, setUseCamera] = useState(false)
  const [scanResults, setScanResults] = useState<{ name: string; section: string; mode: string; time: string; status: string; waLink: string | null; notify: boolean; resultado?: string }[]>([])
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

  const loadHistorial = useCallback(async () => {
    setLoadingHist(true)
    try {
      if (scope === "bimestre") {
        const data = await fetch(`/api/asistencia/bimestre?year=${yearAnchor}&sectionId=${histSectionId}`).then(r => r.json())
        setBimestreData(data)
        setVistaData(null)
      } else {
        const start = scope === "semana" ? weekAnchor : `${monthAnchor}-01`
        const data = await fetch(`/api/asistencia/vista?scope=${scope}&start=${start}&sectionId=${histSectionId}`).then(r => r.json())
        setVistaData(data)
        setBimestreData(null)
      }
    } finally {
      setLoadingHist(false)
    }
  }, [scope, histSectionId, weekAnchor, monthAnchor, yearAnchor])

  useEffect(() => { if (tab === "historial") loadHistorial() }, [tab, loadHistorial])

  function setStatus(studentId: string, status: string) {
    setDirtyAsis(true)
    setRows(rs => rs.map(r => r.studentId === studentId ? { ...r, status } : r))
  }

  /** Justifica una falta o tardanza. La justificación es el texto de la nota. */
  function justificar(r: Row) {
    const actual = r.note ?? ""
    const texto = window.prompt(
      `Justificación de ${r.studentName}

Escribe el motivo (dejarlo vacío quita la justificación):`,
      actual,
    )
    if (texto === null) return
    setDirtyAsis(true)
    setRows(rs => rs.map(x => x.studentId === r.studentId ? { ...x, note: texto.trim() || null } : x))
  }
  function markAll(status: string) {
    setDirtyAsis(true)
    setRows(rs => rs.map(r => ({ ...r, status })))
  }

  async function save() {
    setSaving(true)
    await fetch("/api/asistencia", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId, date, records: rows.map(r => ({ studentId: r.studentId, status: r.status, note: r.note ?? null })) }),
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

  async function downloadExcel() {
    setDownloading(true)
    try {
      const ExcelLib = (await import("exceljs")).default
      const wb = new ExcelLib.Workbook()
      wb.creator = "I.E.P. Cristo Reina"
      wb.created = new Date()

      if (scope === "bimestre") {
        if (!bimestreData || bimestreData.sections.length === 0) {
          setToast("No hay alumnos para el filtro seleccionado")
          setTimeout(() => setToast(""), 2500)
          return
        }
        for (const sec of bimestreData.sections) buildBimestreSheet(wb, sec, bimestreData)
        wb.xlsx.writeBuffer().then(buf => downloadBlob(buf, `consolidado_bimestral_${bimestreData.year}.xlsx`))
      } else {
        if (!vistaData || vistaData.sections.length === 0) {
          setToast("No hay alumnos para el filtro seleccionado")
          setTimeout(() => setToast(""), 2500)
          return
        }
        const label = scope === "semana" ? `semana del ${fmtDate(vistaData.dates[0])}` : monthAnchor
        for (const sec of vistaData.sections) buildVistaSheet(wb, sec, vistaData.dates, scope, label)
        wb.xlsx.writeBuffer().then(buf => downloadBlob(buf, `asistencia_${scope}_${scope === "semana" ? weekAnchor : monthAnchor}.xlsx`))
      }
    } finally {
      setDownloading(false)
    }
  }

  function downloadBlob(buf: BlobPart, filename: string) {
    const blob = new Blob([buf], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  function buildVistaSheet(wb: ExcelJS.Workbook, sec: VistaSection, dates: string[], scope: "semana" | "mes", label: string) {
    const sheetName = sec.name.replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Aula"
    const ws = wb.addWorksheet(sheetName, { views: [{ state: "frozen", xSplit: 2, ySplit: 4 }] })
    const nCols = 2 + dates.length + 4

    ws.mergeCells(1, 1, 1, nCols)
    const title = ws.getCell(1, 1)
    title.value = `I.E.P. CRISTO REINA — ASISTENCIA (${scope === "semana" ? "SEMANAL" : "MENSUAL"})`
    title.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } }
    title.alignment = { horizontal: "center", vertical: "middle" }
    ws.getRow(1).height = 26
    for (let c = 1; c <= nCols; c++) ws.getCell(1, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${XL_NAVY}` } }

    ws.mergeCells(2, 1, 2, nCols)
    const sub = ws.getCell(2, 1)
    sub.value = `Aula: ${sec.name}   ·   ${label}`
    sub.font = { italic: true, size: 10, color: { argb: `FF${XL_NAVY}` } }
    sub.alignment = { horizontal: "center" }
    for (let c = 1; c <= nCols; c++) ws.getCell(2, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${XL_LIGHT}` } }
    ws.getRow(3).height = 4

    const headerRow = 4
    const header = ["N°", "Apellidos y nombres", ...dates.map(fmtDate), "P", "T", "F", "%"]
    header.forEach((h, i) => {
      const cell = ws.getCell(headerRow, i + 1)
      cell.value = h
      cell.font = { bold: true, size: 9, color: { argb: "FFFFFFFF" } }
      cell.alignment = { horizontal: "center", vertical: "middle" }
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${XL_BLUE}` } }
    })
    ws.getRow(headerRow).height = 20

    sec.students.forEach((s, i) => {
      const r = headerRow + 1 + i
      const rowVals: (string | number)[] = [i + 1, s.studentName]
      dates.forEach(d => rowVals.push(STATUS_ABBR[s.marks[d]] ?? ""))
      rowVals.push(s.present, s.late, s.absent, `${s.pct}%`)
      ws.getRow(r).values = rowVals
      const zebra = i % 2 === 1
      for (let c = 1; c <= nCols; c++) {
        const cell = ws.getCell(r, c)
        cell.border = { top: { style: "thin", color: { argb: "FFE5E7EB" } }, bottom: { style: "thin", color: { argb: "FFE5E7EB" } }, left: { style: "thin", color: { argb: "FFE5E7EB" } }, right: { style: "thin", color: { argb: "FFE5E7EB" } } }
        if (zebra) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }
        if (c === 1 || c > 2 + dates.length) cell.alignment = { horizontal: "center" }
      }
      dates.forEach((d, di) => {
        const st = s.marks[d]
        if (st) {
          const cell = ws.getCell(r, 3 + di)
          cell.font = { bold: true, color: { argb: `FF${STATUS_COLOR[st].replace("#", "").toUpperCase()}` } }
        }
      })
      ws.getCell(r, 2 + dates.length + 4).font = { bold: true }
    })

    ws.getColumn(1).width = 5
    ws.getColumn(2).width = 30
    for (let i = 0; i < dates.length; i++) ws.getColumn(3 + i).width = 4.5
    ws.getColumn(3 + dates.length).width = 6
    ws.getColumn(4 + dates.length).width = 6
    ws.getColumn(5 + dates.length).width = 6
    ws.getColumn(6 + dates.length).width = 7
    ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: nCols } }
  }

  function buildBimestreSheet(wb: ExcelJS.Workbook, sec: BimestreSection, data: BimestreData) {
    const sheetName = sec.name.replace(/[\\/?*[\]:]/g, "").slice(0, 31) || "Aula"
    const ws = wb.addWorksheet(sheetName, { views: [{ state: "frozen", xSplit: 2, ySplit: 5 }] })
    const nBim = data.labels.length
    const nCols = 2 + nBim * 4 + 1

    ws.mergeCells(1, 1, 1, nCols)
    const title = ws.getCell(1, 1)
    title.value = `I.E.P. CRISTO REINA — CONSOLIDADO BIMESTRAL ${data.year}`
    title.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } }
    title.alignment = { horizontal: "center", vertical: "middle" }
    ws.getRow(1).height = 26
    for (let c = 1; c <= nCols; c++) ws.getCell(1, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${XL_NAVY}` } }

    ws.mergeCells(2, 1, 2, nCols)
    const sub = ws.getCell(2, 1)
    sub.value = `Aula: ${sec.name}`
    sub.font = { italic: true, size: 10, color: { argb: `FF${XL_NAVY}` } }
    sub.alignment = { horizontal: "center" }
    for (let c = 1; c <= nCols; c++) ws.getCell(2, c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${XL_LIGHT}` } }
    ws.getRow(3).height = 4

    // Fila de labels de bimestre (merge de 4 columnas cada uno)
    const bimRow = 4
    ws.mergeCells(bimRow, 1, bimRow + 1, 1)
    ws.getCell(bimRow, 1).value = "N°"
    ws.mergeCells(bimRow, 2, bimRow + 1, 2)
    ws.getCell(bimRow, 2).value = "Apellidos y nombres"
    data.labels.forEach((label, bi) => {
      const c0 = 3 + bi * 4
      ws.mergeCells(bimRow, c0, bimRow, c0 + 3)
      ws.getCell(bimRow, c0).value = label
      const subHeaders = ["P", "T", "F", "%"]
      subHeaders.forEach((h, hi) => { ws.getCell(bimRow + 1, c0 + hi).value = h })
    })
    ws.mergeCells(bimRow, nCols, bimRow + 1, nCols)
    ws.getCell(bimRow, nCols).value = "% Total"

    for (let r = bimRow; r <= bimRow + 1; r++) {
      for (let c = 1; c <= nCols; c++) {
        const cell = ws.getCell(r, c)
        cell.font = { bold: true, size: 9, color: { argb: "FFFFFFFF" } }
        cell.alignment = { horizontal: "center", vertical: "middle" }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${XL_BLUE}` } }
      }
    }
    ws.getRow(bimRow).height = 18
    ws.getRow(bimRow + 1).height = 18

    sec.students.forEach((s, i) => {
      const r = bimRow + 2 + i
      ws.getCell(r, 1).value = i + 1
      ws.getCell(r, 2).value = s.studentName
      s.b.forEach((bc, bi) => {
        const c0 = 3 + bi * 4
        ws.getCell(r, c0).value = bc.present
        ws.getCell(r, c0 + 1).value = bc.late
        ws.getCell(r, c0 + 2).value = bc.absent
        ws.getCell(r, c0 + 3).value = `${bc.pct}%`
      })
      ws.getCell(r, nCols).value = `${s.total.pct}%`
      ws.getCell(r, nCols).font = { bold: true }

      const zebra = i % 2 === 1
      for (let c = 1; c <= nCols; c++) {
        const cell = ws.getCell(r, c)
        cell.border = { top: { style: "thin", color: { argb: "FFE5E7EB" } }, bottom: { style: "thin", color: { argb: "FFE5E7EB" } }, left: { style: "thin", color: { argb: "FFE5E7EB" } }, right: { style: "thin", color: { argb: "FFE5E7EB" } } }
        if (zebra) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } }
        if (c > 2) cell.alignment = { horizontal: "center" }
      }
    })

    ws.getColumn(1).width = 5
    ws.getColumn(2).width = 30
    for (let i = 0; i < nBim * 4; i++) ws.getColumn(3 + i).width = 5.5
    ws.getColumn(nCols).width = 9
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

  /**
   * El lector QR físico teclea el código completo en milisegundos. Si no
   * envía Enter, nadie presionaría nada: al detectar un código con forma
   * válida y una pausa de tecleo, se registra solo.
   */
  function onScanInput(v: string) {
    setScanInput(v)
    if (autoTimer.current) clearTimeout(autoTimer.current)
    const code = v.trim()
    if (code.length < 8) return
    autoTimer.current = setTimeout(() => { doScan(code) }, 350)
  }

  async function doScan(qrData: string) {
    if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null }
    const code = qrData.trim()
    if (!code) return
    const res = await fetch("/api/asistencia/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ qrData: code, mode: scanMode }) })
    const data = await res.json()
    setScanInput("")
    if (!res.ok) { setScanResults(r => [{ name: data.error ?? "Error", section: "", mode: scanMode, time: "", status: "error", waLink: null, notify: false }, ...r]); return }
    setScanResults(r => [{ name: data.studentName, section: data.section, mode: data.mode, time: data.time, status: data.status, waLink: data.waLink, notify: data.notify, resultado: data.resultado }, ...r].slice(0, 20))
    if (data.notify && data.waLink) window.open(data.waLink, "_blank")
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {toast && <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium shadow-lg">{toast}</div>}

      <div className="print:hidden"><BackButton href="/dashboard/academico" /></div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 print:hidden flex-wrap">
        {[{ k: "marcar", l: "Marcar asistencia" }, { k: "escaneo", l: "Escaneo QR" }, { k: "qr", l: "Códigos QR" }, { k: "historial", l: "Historial" }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as "marcar" | "qr" | "escaneo" | "historial")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.k ? "bg-primary-500 text-white" : "border"}`}
            style={tab === t.k ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* Controls */}
      {(tab === "marcar" || tab === "escaneo" || tab === "qr") && (
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
          <div className="sticky top-16 z-30 flex flex-wrap items-center gap-3 py-2 mb-3 print:hidden" style={{ background: "var(--bg)" }}>
            <div className="flex gap-2 text-xs">
              <span className="text-green-600 font-medium">● {counts.present} presentes</span>
              <span className="text-amber-600 font-medium">● {counts.late} tarde</span>
              <span className="text-red-600 font-medium">● {counts.absent} ausentes</span>
            </div>
            <button onClick={() => markAll("present")} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-green-50 hover:text-green-600 transition-colors ml-auto" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              Marcar todos presente
            </button>
            {rows.length > 0 && (
              <button onClick={save} disabled={saving} className="px-5 py-2 rounded-lg bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 disabled:opacity-60 shadow-sm">
                {saving ? "Guardando..." : "Guardar asistencia"}
              </button>
            )}
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {loading && <p className="text-center py-10 text-sm" style={{ color: "var(--muted)" }}>Cargando...</p>}
            {!loading && rows.length === 0 && <p className="text-center py-10 text-sm" style={{ color: "var(--muted)" }}>No hay alumnos en esta sección</p>}
            {!loading && rows.map((r, i) => (
              <div key={r.studentId} className="flex items-center justify-between px-4 py-2.5 border-t first:border-t-0" style={{ borderColor: "var(--border)" }}>
                <span className="text-sm font-medium min-w-0" style={{ color: "var(--fg)" }}>
                  {i + 1}. {r.studentName}
                  {r.note && (
                    <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full font-medium align-middle"
                      style={{ background: "var(--ok-bg)", color: "var(--ok)" }} title={r.note}>
                      Justificada
                    </span>
                  )}
                </span>
                <div className="flex gap-1 items-center shrink-0">
                  {(r.status === "absent" || r.status === "late") && (
                    <button onClick={() => justificar(r)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors hover:bg-green-50"
                      style={{ borderColor: "var(--border)", color: r.note ? "var(--ok)" : "var(--muted)" }}
                      title={r.note ?? "Agregar justificación"}>
                      {r.note ? "Editar just." : "Justificar"}
                    </button>
                  )}
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

        </>
      )}

      {/* ESCANEO */}
      {tab === "escaneo" && (
        <div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => setScanMode("auto")} className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${scanMode === "auto" ? "bg-primary-500 text-white" : "border"}`} style={scanMode === "auto" ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>Automático</button>
            <button onClick={() => setScanMode("entry")} className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${scanMode === "entry" ? "bg-green-500 text-white" : "border"}`} style={scanMode === "entry" ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>🟢 Ingreso</button>
            <button onClick={() => setScanMode("exit")} className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${scanMode === "exit" ? "bg-primary-500 text-white" : "border"}`} style={scanMode === "exit" ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>🔵 Salida</button>
          </div>
          {/* Solo cámara: el ingreso manual no aportaba y obligaba a teclear. */}
          <div className="mb-4">
            <QrScanner active={tab === "escaneo"} onScan={(text) => doScan(text)} />
            <p className="text-center text-xs mt-2" style={{ color: "var(--muted)" }}>
              Apunta el código del alumno a la cámara. Se registra solo, no hay que pulsar nada.
            </p>
          </div>

          <div className="space-y-2">
            {scanResults.length === 0 && <p className="text-center py-8 text-sm" style={{ color: "var(--muted)" }}>Los registros aparecerán aquí</p>}
            {scanResults.map((r, i) => (
              <div key={i} className="rounded-xl border p-3 flex items-center gap-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                {r.status === "error" ? (
                  <span className="text-sm font-semibold" style={{ color: "var(--danger)" }}>No se pudo registrar: {r.name}</span>
                ) : (
                  <>
                    {/* Un tilde grande y el estado en palabras: el operador tiene
                        que saber de un vistazo si quedó registrado o no. */}
                    <span className="grid place-items-center rounded-full shrink-0" style={{
                      width: 34, height: 34, color: "#fff",
                      background: r.resultado === "duplicado" ? "var(--muted)" : r.mode === "exit" ? "var(--brand-ink)" : "var(--ok)",
                    }}>
                      {r.resultado === "duplicado"
                        ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 7v6M12 16.5v.01"/></svg>
                        : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: "var(--fg)" }}>{r.name} <span className="text-xs font-normal" style={{ color: "var(--muted)" }}>· {r.section}</span></p>
                      <p className="text-xs font-semibold mt-0.5" style={{ color: r.resultado === "duplicado" ? "var(--muted)" : r.mode === "exit" ? "var(--brand-ink)" : "var(--ok)" }}>
                        {r.resultado === "duplicado"
                          ? `Ya estaba registrado a las ${r.time}`
                          : `${r.mode === "exit" ? "SALIDA" : "INGRESO"} registrado · ${r.time}${r.status === "late" ? " · Tardanza" : ""}`}
                      </p>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 print:grid-cols-2 gap-4 print:gap-3">
            {qrRows.map(q => (
              <div key={q.studentId} className="rounded-xl border p-4 flex flex-col items-center text-center print:border-0 print:break-inside-avoid" style={{ background: "white", borderColor: "var(--border)" }}>
                <QRCodeSVG value={q.qrData} size={180} level="M" />
                <p className="text-sm font-semibold mt-2 text-black">{q.studentName}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* HISTORIAL */}
      {tab === "historial" && (
        <div>
          {/* Selector de vista */}
          <div className="flex gap-2 mb-4">
            {[{ k: "semana", l: "Semana" }, { k: "mes", l: "Mes" }, { k: "bimestre", l: "Bimestre" }].map(o => (
              <button key={o.k} onClick={() => setScope(o.k as "semana" | "mes" | "bimestre")}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${scope === o.k ? "bg-primary-500 text-white" : "border"}`}
                style={scope === o.k ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>
                {o.l}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-end mb-5">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Aula</label>
              <select value={histSectionId} onChange={e => setHistSectionId(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
                style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}>
                <option value="all">Todas las aulas</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {scope === "semana" && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Cualquier día de la semana</label>
                <input type="date" value={weekAnchor} onChange={e => setWeekAnchor(e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }} />
              </div>
            )}
            {scope === "mes" && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Mes</label>
                <input type="month" value={monthAnchor} onChange={e => setMonthAnchor(e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }} />
              </div>
            )}
            {scope === "bimestre" && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Año</label>
                <input type="number" value={yearAnchor} onChange={e => setYearAnchor(parseInt(e.target.value) || yearAnchor)}
                  className="w-24 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }} />
              </div>
            )}
            <button onClick={downloadExcel} disabled={downloading} className="px-5 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">
              {downloading ? "Generando..." : "⬇ Descargar Excel"}
            </button>
          </div>

          {loadingHist && <p className="text-center py-10 text-sm" style={{ color: "var(--muted)" }}>Cargando...</p>}

          {/* Vista Semana / Mes */}
          {!loadingHist && scope !== "bimestre" && vistaData && (
            <div className="space-y-6">
              {vistaData.sections.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>No hay alumnos para el filtro seleccionado.</p>}
              {vistaData.sections.map(sec => (
                <div key={sec.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  <div className="px-4 py-2 text-sm font-bold" style={{ background: "var(--surface)", color: "var(--fg)" }}>{sec.name}</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "var(--surface)" }}>
                          <th className="px-2 py-1.5 text-left" style={{ color: "var(--muted)" }}>Alumno</th>
                          {vistaData.dates.map(d => <th key={d} className="px-1 py-1.5 text-center" style={{ color: "var(--muted)" }}>{fmtDate(d)}</th>)}
                          <th className="px-2 py-1.5 text-center" style={{ color: "var(--muted)" }}>%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sec.students.map((s) => (
                          <tr key={s.studentId} className="border-t" style={{ borderColor: "var(--border)" }}>
                            <td className="px-2 py-1 whitespace-nowrap" style={{ color: "var(--fg)" }}>{s.studentName}</td>
                            {vistaData.dates.map(d => {
                              const st = s.marks[d]
                              return <td key={d} className="px-1 py-1 text-center font-medium" style={{ color: st ? STATUS_COLOR[st] : "var(--muted)" }}>{STATUS_ABBR[st] ?? ""}</td>
                            })}
                            <td className="px-2 py-1 text-center font-semibold" style={{ color: "var(--fg)" }}>{s.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <p className="text-xs" style={{ color: "var(--muted)" }}>A = Asistió · T = Tarde · F = Falta · celda vacía = sin marcar ese día.</p>
            </div>
          )}

          {/* Vista Bimestre */}
          {!loadingHist && scope === "bimestre" && bimestreData && (
            <div className="space-y-6">
              {bimestreData.sections.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>No hay alumnos para el filtro seleccionado.</p>}
              {bimestreData.sections.map(sec => (
                <div key={sec.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  <div className="px-4 py-2 text-sm font-bold" style={{ background: "var(--surface)", color: "var(--fg)" }}>{sec.name}</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "var(--surface)" }}>
                          <th className="px-2 py-1.5 text-left" style={{ color: "var(--muted)" }} rowSpan={2}>Alumno</th>
                          {bimestreData.labels.map(l => <th key={l} className="px-2 py-1 text-center border-l" style={{ color: "var(--muted)", borderColor: "var(--border)" }} colSpan={4}>{l}</th>)}
                          <th className="px-2 py-1.5 text-center border-l" style={{ color: "var(--muted)", borderColor: "var(--border)" }} rowSpan={2}>% Total</th>
                        </tr>
                        <tr style={{ background: "var(--surface)" }}>
                          {bimestreData.labels.map(l => (
                            <>
                              <th key={l + "p"} className="px-1 py-1 text-center border-l text-green-600" style={{ borderColor: "var(--border)" }}>P</th>
                              <th key={l + "t"} className="px-1 py-1 text-center text-amber-600">T</th>
                              <th key={l + "f"} className="px-1 py-1 text-center text-red-600">F</th>
                              <th key={l + "%"} className="px-1 py-1 text-center" style={{ color: "var(--muted)" }}>%</th>
                            </>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sec.students.map((s) => (
                          <tr key={s.studentId} className="border-t" style={{ borderColor: "var(--border)" }}>
                            <td className="px-2 py-1 whitespace-nowrap" style={{ color: "var(--fg)" }}>{s.studentName}</td>
                            {s.b.map((bc, bi) => (
                              <>
                                <td key={bi + "p"} className="px-1 py-1 text-center border-l text-green-600 font-medium" style={{ borderColor: "var(--border)" }}>{bc.present}</td>
                                <td key={bi + "t"} className="px-1 py-1 text-center text-amber-600 font-medium">{bc.late}</td>
                                <td key={bi + "f"} className="px-1 py-1 text-center text-red-600 font-medium">{bc.absent}</td>
                                <td key={bi + "%"} className="px-1 py-1 text-center" style={{ color: "var(--muted)" }}>{bc.pct}%</td>
                              </>
                            ))}
                            <td className="px-2 py-1 text-center font-bold border-l" style={{ color: "var(--fg)", borderColor: "var(--border)" }}>{s.total.pct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border p-5 mt-8" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: "var(--fg)" }}>Cargar tu plantilla de asistencia</h3>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
              Sube un Excel con tu propio formato. Detecta automáticamente todos los meses que tenga la hoja y registra la asistencia de cada alumno del aula que elijas.
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
