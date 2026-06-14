"use client"

import { useState } from "react"
import * as XLSX from "xlsx"

type ParsedRow = {
  firstName: string
  lastName: string
  dni: string
  gradeName: string
  sectionName: string
  guardianName: string
  guardianPhone: string
  monthlyFee: string
}

const HEADERS = ["Nombres", "Apellidos", "DNI", "Grado", "Sección", "Apoderado", "Teléfono", "Pensión"]

function mapRow(raw: Record<string, unknown>): ParsedRow {
  const get = (k: string) => String(raw[k] ?? raw[k.toLowerCase()] ?? "").trim()
  return {
    firstName: get("Nombres"),
    lastName: get("Apellidos"),
    dni: get("DNI"),
    gradeName: get("Grado"),
    sectionName: get("Sección") || get("Seccion"),
    guardianName: get("Apoderado"),
    guardianPhone: get("Teléfono") || get("Telefono"),
    monthlyFee: get("Pensión") || get("Pension"),
  }
}

export default function ImportarAlumnos({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null)

  function downloadTemplate() {
    const ws = XLSX.utils.aoa_to_sheet([
      HEADERS,
      ["Juan", "Pérez García", "71234567", "1° Grado", "A", "María García", "987654321", "150"],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Alumnos")
    XLSX.writeFile(wb, "plantilla_alumnos.xlsx")
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: "array" })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)
      setRows(json.map(mapRow).filter(r => r.firstName || r.lastName))
    }
    reader.readAsArrayBuffer(file)
  }

  async function doImport() {
    setImporting(true)
    const res = await fetch("/api/alumnos/importar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    }).then(r => r.json())
    setImporting(false)
    setResult(res)
    if (res.created > 0) onDone()
  }

  function close() {
    setOpen(false); setRows([]); setResult(null)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-4 py-2 rounded-lg border text-sm font-semibold hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300 transition-colors" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
        Importar Excel
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl border p-6 shadow-xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: "var(--fg)" }}>Importar alumnos desde Excel</h2>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>Descarga la plantilla, complétala y súbela. La columna Grado debe coincidir (ej. "1° Grado", sección "A").</p>

            <div className="flex gap-3 mb-4">
              <button onClick={downloadTemplate} className="px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600">
                ↓ Descargar plantilla
              </button>
              <label className="px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer hover:bg-primary-50 transition-colors" style={{ borderColor: "var(--border)", color: "var(--fg)" }}>
                Seleccionar archivo
                <input type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" />
              </label>
            </div>

            {rows.length > 0 && !result && (
              <>
                <p className="text-sm font-medium mb-2" style={{ color: "var(--fg)" }}>{rows.length} alumnos detectados:</p>
                <div className="rounded-lg border overflow-x-auto max-h-60 overflow-y-auto mb-4" style={{ borderColor: "var(--border)" }}>
                  <table className="w-full text-xs">
                    <thead className="sticky top-0" style={{ background: "var(--surface)" }}>
                      <tr>{["Nombres", "Apellidos", "DNI", "Grado/Sec", "Apoderado", "Pensión"].map(h => (
                        <th key={h} className="text-left px-2 py-1.5 font-semibold" style={{ color: "var(--muted)" }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i} className="border-t" style={{ borderColor: "var(--border)" }}>
                          <td className="px-2 py-1" style={{ color: "var(--fg)" }}>{r.firstName}</td>
                          <td className="px-2 py-1" style={{ color: "var(--fg)" }}>{r.lastName}</td>
                          <td className="px-2 py-1" style={{ color: "var(--muted)" }}>{r.dni}</td>
                          <td className="px-2 py-1" style={{ color: "var(--muted)" }}>{r.gradeName} {r.sectionName}</td>
                          <td className="px-2 py-1" style={{ color: "var(--muted)" }}>{r.guardianName}</td>
                          <td className="px-2 py-1" style={{ color: "var(--muted)" }}>{r.monthlyFee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {result && (
              <div className="rounded-lg border p-4 mb-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <p className="text-sm font-semibold text-green-600 mb-1">✓ {result.created} alumnos importados</p>
                {result.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-red-600">{result.errors.length} advertencias:</p>
                    <ul className="text-xs mt-1 space-y-0.5 max-h-32 overflow-y-auto" style={{ color: "var(--muted)" }}>
                      {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button onClick={close} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                {result ? "Cerrar" : "Cancelar"}
              </button>
              {rows.length > 0 && !result && (
                <button onClick={doImport} disabled={importing} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-60">
                  {importing ? "Importando..." : `Importar ${rows.length} alumnos`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
