"use client"

import { useState, useEffect, useCallback } from "react"
import BackButton from "@/components/BackButton"

type Row = {
  studentId: string
  studentName: string
  section: string
  guardianName: string
  guardianPhone: string
  fee: number
  orderId: string | null
  amount: number
  status: string
  paidTotal: number
}

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
const COLEGIO = "I.E.P. Cristo Reina"

function isMoroso(status: string, year: number, month: number): boolean {
  if (status === "paid") return false
  const now = new Date()
  const curY = now.getFullYear(), curM = now.getMonth() + 1
  if (status === "sin_generar") return false
  return year < curY || (year === curY && month < curM)
}

export default function FinanzasClient() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<Record<string, string>>({})
  const [search, setSearch] = useState("")
  const [payModal, setPayModal] = useState<Row | null>(null)
  const [payAmount, setPayAmount] = useState("")
  const [payMethod, setPayMethod] = useState("cash")

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetch(`/api/finanzas?year=${year}&month=${month}`).then(r => r.json())
    setRows(data.rows ?? [])
    setLoading(false)
  }, [year, month])

  useEffect(() => { load() }, [load])
  useEffect(() => { fetch("/api/config").then(r => r.json()).then(setConfig) }, [])

  const [toast, setToast] = useState("")
  const [tab, setTab] = useState<"mes" | "morosidad">("mes")
  const [moros, setMoros] = useState<{ rows: { studentId: string; studentName: string; phone: string | null; debt: number; months: string[] }[]; totalDebt: number; count: number } | null>(null)

  const loadMoros = useCallback(async () => {
    const data = await fetch("/api/finanzas/morosidad").then(r => r.json())
    setMoros(data)
  }, [])
  useEffect(() => { if (tab === "morosidad") loadMoros() }, [tab, loadMoros])

  function morosLink(r: { studentName: string; phone: string | null; debt: number; months: string[] }): string {
    const template = config.overdueTemplate ?? "Estimado apoderado de {alumno}, registra una deuda de S/ {monto}. Por favor regularizar. — I.E.P. Cristo Reina"
    const msg = template.replaceAll("{alumno}", r.studentName).replaceAll("{monto}", r.debt.toFixed(2)).replaceAll("{mes}", r.months.join(", ")).replaceAll("{anio}", String(year)).replaceAll("{colegio}", COLEGIO)
    return `https://wa.me/51${(r.phone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`
  }

  async function generarOrdenes() {
    const res = await fetch("/api/finanzas/generar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, month }),
    }).then(r => r.json())
    setToast(`${res.created} órdenes generadas para ${MESES[month - 1]} ${year}`)
    setTimeout(() => setToast(""), 3000)
    await load()
  }

  function openPay(row: Row) {
    setPayModal(row)
    setPayAmount(String(row.amount - row.paidTotal))
    setPayMethod("cash")
  }

  async function registrarPago(e: React.FormEvent) {
    e.preventDefault()
    if (!payModal?.orderId) return
    await fetch("/api/finanzas/pago", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: payModal.orderId, amount: payAmount, method: payMethod }),
    })
    setPayModal(null)
    await load()
  }

  function buildMsg(row: Row, template: string): string {
    return template
      .replaceAll("{alumno}", row.studentName)
      .replaceAll("{mes}", MESES[month - 1])
      .replaceAll("{anio}", String(year))
      .replaceAll("{monto}", row.amount.toFixed(2))
      .replaceAll("{colegio}", COLEGIO)
  }

  function whatsappLink(row: Row): string {
    const moroso = isMoroso(row.status, year, month)
    const template = moroso
      ? (config.overdueTemplate ?? "Estimado apoderado de {alumno}, tiene una deuda de S/ {monto} de {mes} {anio}.")
      : (config.paymentReminderTemplate ?? "Estimado apoderado de {alumno}, le recordamos la pensión de {mes} {anio} por S/ {monto}.")
    const phone = row.guardianPhone.replace(/\D/g, "")
    return `https://wa.me/51${phone}?text=${encodeURIComponent(buildMsg(row, template))}`
  }

  const filtered = rows.filter(r => r.studentName.toLowerCase().includes(search.toLowerCase()) || r.section.toLowerCase().includes(search.toLowerCase()))

  const stats = {
    pagados: rows.filter(r => r.status === "paid").length,
    pendientes: rows.filter(r => r.status === "pending" || r.status === "partial").length,
    morosos: rows.filter(r => isMoroso(r.status, year, month)).length,
    recaudado: rows.reduce((s, r) => s + r.paidTotal, 0),
    porCobrar: rows.filter(r => r.status !== "sin_generar").reduce((s, r) => s + (r.amount - r.paidTotal), 0),
  }
  const sinGenerar = rows.some(r => r.status === "sin_generar")

  const badge = (row: Row) => {
    if (row.status === "sin_generar") return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Sin generar</span>
    if (row.status === "paid") return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Pagado</span>
    if (isMoroso(row.status, year, month)) return <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Moroso</span>
    if (row.status === "partial") return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Parcial</span>
    return <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-medium">Pendiente</span>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}
      <BackButton href="/dashboard" />
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Finanzas</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{tab === "mes" ? `Pensiones de ${MESES[month - 1]} ${year}` : "Reporte de morosidad acumulada"}</p>
        </div>
        {tab === "mes" && (
          <div className="flex items-center gap-2">
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
              className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}>
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))}
              className="px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }}>
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {sinGenerar && (
              <button onClick={generarOrdenes} className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600">
                Generar mes
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[{ k: "mes", l: "Pensiones del mes" }, { k: "morosidad", l: "Morosidad" }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k as "mes" | "morosidad")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.k ? "bg-primary-500 text-white" : "border"}`}
            style={tab === t.k ? {} : { borderColor: "var(--border)", color: "var(--muted)" }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* MOROSIDAD */}
      {tab === "morosidad" && (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <Stat label="Alumnos morosos" value={String(moros?.count ?? 0)} color="text-red-600" />
            <Stat label="Deuda total acumulada" value={`S/ ${(moros?.totalDebt ?? 0).toFixed(0)}`} color="text-red-600" />
          </div>
          <div className="rounded-xl border overflow-x-auto" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--surface)" }}>
                  {["Alumno", "Meses adeudados", "Deuda", "Acción"].map(h => <th key={h} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider" style={{ color: "var(--muted)" }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {(!moros || moros.rows.length === 0) && <tr><td colSpan={4} className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>Sin morosos 🎉</td></tr>}
                {moros?.rows.map(r => (
                  <tr key={r.studentId} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--fg)" }}>{r.studentName}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{r.months.join(", ")}</td>
                    <td className="px-4 py-3 font-bold text-red-600">S/ {r.debt.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {r.phone && <a href={morosLink(r)} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded bg-[#25D366] text-white hover:opacity-90">WhatsApp</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats */}
      {tab === "mes" && (
      <div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <Stat label="Pagados" value={String(stats.pagados)} color="text-green-600" />
        <Stat label="Pendientes" value={String(stats.pendientes)} color="text-sky-600" />
        <Stat label="Morosos" value={String(stats.morosos)} color="text-red-600" />
        <Stat label="Recaudado" value={`S/ ${stats.recaudado.toFixed(0)}`} color="text-primary-600" />
        <Stat label="Por cobrar" value={`S/ ${stats.porCobrar.toFixed(0)}`} color="text-amber-600" />
      </div>

      <input type="text" placeholder="Buscar alumno o sección..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
        style={{ background: "var(--surface)", borderColor: "var(--border)", color: "var(--fg)" }} />

      <div className="rounded-xl border overflow-x-auto" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface)" }}>
              {["Alumno", "Sección", "Apoderado", "Monto", "Estado", "Acciones"].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "var(--muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>Cargando...</td></tr>}
            {!loading && filtered.map(row => (
              <tr key={row.studentId} className="border-t hover:bg-primary-50/20 transition-colors" style={{ borderColor: "var(--border)" }}>
                <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: "var(--fg)" }}>{row.studentName}</td>
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>{row.section}</td>
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--muted)" }}>
                  {row.guardianName || "—"}
                  {row.guardianPhone && <span className="block text-xs">{row.guardianPhone}</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap" style={{ color: "var(--fg)" }}>
                  S/ {row.amount.toFixed(2)}
                  {row.paidTotal > 0 && row.status !== "paid" && <span className="block text-xs text-green-600">Pagó S/ {row.paidTotal.toFixed(2)}</span>}
                </td>
                <td className="px-4 py-3">{badge(row)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {row.orderId && row.status !== "paid" && (
                      <button onClick={() => openPay(row)} className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600">Registrar pago</button>
                    )}
                    {row.guardianPhone && (
                      <a href={whatsappLink(row)} target="_blank" rel="noopener noreferrer"
                        className="text-xs px-2 py-1 rounded bg-[#25D366] text-white hover:opacity-90 flex items-center gap-1">
                        WhatsApp
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
      )}

      {/* Modal pago */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border p-6 shadow-xl" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: "var(--fg)" }}>Registrar pago</h2>
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>{payModal.studentName} — {MESES[month - 1]} {year}</p>
            <form onSubmit={registrarPago} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Monto (S/)</label>
                <input type="number" step="0.01" required value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--fg)" }}>Método</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }}>
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="yape">Yape / Plin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setPayModal(null)} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600">Confirmar pago</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border p-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{label}</p>
    </div>
  )
}
