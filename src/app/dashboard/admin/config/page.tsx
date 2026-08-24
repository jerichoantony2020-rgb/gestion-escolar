"use client"

import { useState, useEffect } from "react"
import BackButton from "@/components/BackButton"

export default function ConfigPage() {
  const [config, setConfig] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(setConfig)
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch("/api/config", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(config) })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function set(key: string, value: string) { setConfig(c => ({ ...c, [key]: value })) }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <BackButton href="/dashboard/admin" />

      <form onSubmit={handleSave} className="space-y-6">
        <div className="sticky top-16 z-30 flex justify-end py-2" style={{ background: "var(--bg)" }}>
          <button type="submit" disabled={saving}
            className="px-5 py-2 rounded-lg bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 disabled:opacity-60 transition-colors shadow-sm">
            {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios"}
          </button>
        </div>

        {/* Pagos */}
        <section className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "var(--fg)" }}>Pagos y pensiones</h2>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--fg)" }}>Pensión mensual por defecto (S/)</label>
            <input type="number" step="0.01" value={config.defaultMonthlyFee ?? ""} onChange={e => set("defaultMonthlyFee", e.target.value)}
              className="w-40 px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500"
              style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
          </div>
        </section>

        {/* Plantillas WhatsApp */}
        <section className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="font-semibold mb-1" style={{ color: "var(--fg)" }}>Plantillas de WhatsApp</h2>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
            Variables disponibles: <code className="bg-gray-100 px-1 rounded">{"{alumno}"}</code>{" "}
            <code className="bg-gray-100 px-1 rounded">{"{mes}"}</code>{" "}
            <code className="bg-gray-100 px-1 rounded">{"{anio}"}</code>{" "}
            <code className="bg-gray-100 px-1 rounded">{"{monto}"}</code>
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--fg)" }}>Mensaje de recordatorio de pago</label>
              <textarea rows={3} value={config.paymentReminderTemplate ?? ""} onChange={e => set("paymentReminderTemplate", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--fg)" }}>Mensaje para morosos</label>
              <textarea rows={3} value={config.overdueTemplate ?? ""} onChange={e => set("overdueTemplate", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
            </div>
          </div>
        </section>

        {/* Notificación al escanear */}
        <section className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="font-semibold mb-1" style={{ color: "var(--fg)" }}>Notificación de ingreso/salida</h2>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
            Al escanear el QR del alumno se puede avisar al apoderado por WhatsApp. Variables: <code className="bg-gray-100 px-1 rounded">{"{alumno}"}</code> <code className="bg-gray-100 px-1 rounded">{"{hora}"}</code> <code className="bg-gray-100 px-1 rounded">{"{fecha}"}</code>
          </p>
          <label className="flex items-center gap-2 cursor-pointer mb-4">
            <input type="checkbox" checked={config.notifyOnScan === "true"} onChange={e => set("notifyOnScan", e.target.checked ? "true" : "false")} />
            <span className="text-sm" style={{ color: "var(--fg)" }}>Abrir WhatsApp automáticamente al escanear</span>
          </label>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--fg)" }}>Mensaje de ingreso</label>
              <textarea rows={2} value={config.scanEntryTemplate ?? ""} onChange={e => set("scanEntryTemplate", e.target.value)} placeholder="👋 {alumno} ingresó al colegio a las {hora} del {fecha}."
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--fg)" }}>Mensaje de salida</label>
              <textarea rows={2} value={config.scanExitTemplate ?? ""} onChange={e => set("scanExitTemplate", e.target.value)} placeholder="🏠 {alumno} salió del colegio a las {hora} del {fecha}."
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
            </div>
          </div>
          <p className="text-xs mt-3 p-2 rounded-lg bg-amber-50 text-amber-700">
            ℹ️ El envío 100% automático y silencioso requiere la API de WhatsApp Business (Meta/Twilio, de pago). Esta versión abre WhatsApp con el mensaje listo para enviar con un toque.
          </p>
        </section>

        {/* Notificación de conducta */}
        <section className="rounded-xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h2 className="font-semibold mb-1" style={{ color: "var(--fg)" }}>Notificación de conducta</h2>
          <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
            Al registrar una falta con código se puede avisar al apoderado por WhatsApp. Variables: <code className="bg-gray-100 px-1 rounded">{"{alumno}"}</code> <code className="bg-gray-100 px-1 rounded">{"{codigo}"}</code> <code className="bg-gray-100 px-1 rounded">{"{descripcion}"}</code> <code className="bg-gray-100 px-1 rounded">{"{puntos}"}</code> <code className="bg-gray-100 px-1 rounded">{"{fecha}"}</code>
          </p>
          <label className="flex items-center gap-2 cursor-pointer mb-4">
            <input type="checkbox" checked={config.notifyOnConduct === "true"} onChange={e => set("notifyOnConduct", e.target.checked ? "true" : "false")} />
            <span className="text-sm" style={{ color: "var(--fg)" }}>Ofrecer avisar por WhatsApp al registrar una falta</span>
          </label>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--fg)" }}>Mensaje de conducta</label>
            <textarea rows={4} value={config.conductTemplate ?? ""} onChange={e => set("conductTemplate", e.target.value)}
              placeholder={"📋 Registro de conducta — {alumno}\nCódigo {codigo}: {descripcion}\nPuntos descontados: {puntos}\nFecha: {fecha}"}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-primary-500 resize-none" style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--fg)" }} />
          </div>
        </section>

      </form>
    </div>
  )
}
