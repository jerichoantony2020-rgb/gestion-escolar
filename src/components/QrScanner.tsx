"use client"

import { useEffect, useRef, useState } from "react"
import { Html5Qrcode } from "html5-qrcode"

// Escáner de QR usando la cámara del dispositivo (móvil/laptop).
// Llama onScan(text) por cada lectura, con anti-rebote para no repetir.
export default function QrScanner({ onScan, active }: { onScan: (text: string) => void; active: boolean }) {
  const containerId = "qr-reader"
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastRef = useRef<{ text: string; at: number }>({ text: "", at: 0 })
  const [error, setError] = useState("")
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!active) return
    let cancelled = false

    async function start() {
      try {
        const scanner = new Html5Qrcode(containerId, { verbose: false })
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (decodedText) => {
            const now = Date.now()
            // La cámara lee ~10 veces por segundo. Con 2.5s, un alumno que
            // sostenía su código 3 segundos disparaba una segunda lectura y
            // quedaba con ingreso Y salida. El servidor tiene la defensa
            // definitiva (5 min), esto solo evita el viaje de ida y vuelta.
            if (decodedText === lastRef.current.text && now - lastRef.current.at < 15000) return
            lastRef.current = { text: decodedText, at: now }
            onScan(decodedText)
          },
          () => {} // ignorar fallos de frame
        )
        if (!cancelled) setRunning(true)
      } catch (e) {
        // Algunos navegadores no traen mensaje: no mostrar "(undefined)".
        const detalle = (e as Error)?.message
        setError("No se pudo abrir la cámara. Revisa que le hayas dado permiso en el navegador" + (detalle ? ` (${detalle})` : "") + ".")
      }
    }
    start()

    return () => {
      cancelled = true
      const s = scannerRef.current
      if (s) {
        try {
          const st = s.getState?.()
          // 2 = SCANNING, 3 = PAUSED (Html5QrcodeScannerState)
          if (st === 2 || st === 3) {
            s.stop().then(() => { try { s.clear() } catch {} }).catch(() => {})
          } else {
            try { s.clear() } catch {}
          }
        } catch {
          // ignore: cámara no llegó a iniciar
        }
        scannerRef.current = null
      }
      setRunning(false)
    }
  }, [active, onScan])

  if (!active) return null

  return (
    <div>
      <div id={containerId} className="w-full max-w-sm mx-auto rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }} />
      {running && <p className="text-center text-xs mt-2" style={{ color: "var(--muted)" }}>📷 Apunta al código QR del estudiante</p>}
      {error && <p className="text-center text-xs mt-2 text-red-500">{error}</p>}
    </div>
  )
}
