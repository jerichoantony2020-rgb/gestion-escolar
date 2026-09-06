"use client"

import { useState, useRef, useCallback } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"

const QrScanner = dynamic(() => import("@/components/QrScanner"), { ssr: false })

type Marca = {
  studentId: string
  name: string
  aula: string
  status: string
  time: string | null
  duplicado?: boolean
}
type Hallazgo = {
  id: string; name: string; aula: string; nivel: string
  yaMarcado: string | null; horaMarcado: string | null
}

/**
 * Tomar asistencia. Es la pantalla que más se usa y se usa de pie, con una
 * mano y con el celular: por eso abre directo en la cámara y no pide elegir
 * aula, curso ni bimestre. Buscar por nombre es la salida cuando el alumno
 * no trae su código.
 */
export default function TomarAsistenciaPage() {
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [modo, setModo] = useState<"qr" | "buscar">("qr")
  const [q, setQ] = useState("")
  const [hallazgos, setHallazgos] = useState<Hallazgo[]>([])
  const [buscando, setBuscando] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const registrar = useCallback(async (qrData: string) => {
    const res = await fetch("/api/asistencia/scan", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrData, mode: "auto" }),
    })
    const d = await res.json()
    if (!res.ok) {
      setMarcas(m => [{ studentId: "", name: d.error ?? "Código no reconocido", aula: "", status: "error", time: null }, ...m])
      return
    }
    setMarcas(m => [{
      studentId: d.studentId, name: d.studentName, aula: d.section,
      status: d.status, time: d.time, duplicado: d.resultado === "duplicado",
    }, ...m].slice(0, 40))
    if (navigator.vibrate) navigator.vibrate(d.resultado === "duplicado" ? 40 : [30, 40, 30])
  }, [])

  function buscar(texto: string) {
    setQ(texto)
    if (debounce.current) clearTimeout(debounce.current)
    if (texto.trim().length < 2) { setHallazgos([]); return }
    setBuscando(true)
    debounce.current = setTimeout(async () => {
      const r = await fetch(`/api/alumnos/buscar?q=${encodeURIComponent(texto)}`).then(x => x.json())
      setHallazgos(r); setBuscando(false)
    }, 280)
  }

  async function marcarManual(h: Hallazgo, status?: string) {
    const d = await fetch("/api/asistencia/marcar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: h.id, status }),
    }).then(r => r.json())
    if (!d.ok) return
    setMarcas(m => [{ studentId: d.studentId, name: d.studentName, aula: d.aula, status: d.status, time: d.time }, ...m].slice(0, 40))
    setHallazgos(hs => hs.map(x => x.id === h.id ? { ...x, yaMarcado: d.status } : x))
  }

  async function deshacer(studentId: string) {
    await fetch("/api/asistencia/scan/deshacer", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    })
    setMarcas(m => m.filter(x => x.studentId !== studentId))
  }

  const hoy = marcas.filter(m => m.status !== "error" && !m.duplicado)
  const tardes = hoy.filter(m => m.status === "late").length

  return (
    <div className="tomar">
      <div className="tomar-head brand-field">
        <div className="tomar-head-in">
          <Link href="/dashboard" className="page-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            Inicio
          </Link>
          <h1>Tomar asistencia</h1>
          <p suppressHydrationWarning>
            {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })} · puntual hasta las 8:50
          </p>
        </div>
        <div className="tomar-tally">
          <span><b>{hoy.length}</b> registrados</span>
          {tardes > 0 && <span className="tomar-tally-late"><b>{tardes}</b> tardanza{tardes === 1 ? "" : "s"}</span>}
        </div>
      </div>

      <div className="tomar-seg">
        <button onClick={() => setModo("qr")} data-on={modo === "qr" ? "" : undefined}>Escanear</button>
        <button onClick={() => setModo("buscar")} data-on={modo === "buscar" ? "" : undefined}>Buscar por nombre</button>
      </div>

      {modo === "qr" ? (
        <div className="tomar-cam">
          <QrScanner active={modo === "qr"} onScan={registrar} />
          <p className="tomar-hint">Apunta el código del alumno. Se registra solo.</p>
        </div>
      ) : (
        <div className="tomar-buscar">
          <input value={q} onChange={e => buscar(e.target.value)} autoFocus
            placeholder="Apellido o nombre del alumno" inputMode="search" enterKeyHint="search" />
          {buscando && <p className="tomar-hint">Buscando…</p>}
          {!buscando && q.trim().length >= 2 && hallazgos.length === 0 && (
            <p className="tomar-hint">Ningún alumno coincide con “{q}”.</p>
          )}
          {hallazgos.map(h => (
            <div key={h.id} className="tomar-hit">
              <div className="tomar-hit-id">
                <span className="tomar-hit-n">{h.name}</span>
                <span className="tomar-hit-a">{h.aula}</span>
              </div>
              {h.yaMarcado ? (
                <span className={`tomar-chip tomar-chip-${h.yaMarcado}`}>
                  {h.yaMarcado === "absent" ? "Faltó" : h.yaMarcado === "late" ? "Tardanza" : "Presente"}
                </span>
              ) : (
                <div className="tomar-hit-acts">
                  <button className="tomar-b-ok" onClick={() => marcarManual(h)}>Llegó</button>
                  <button className="tomar-b-no" onClick={() => marcarManual(h, "absent")}>Faltó</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="tomar-lista">
        {marcas.length === 0 && <p className="tomar-vacio">Aún no has registrado a nadie hoy.</p>}
        {marcas.map((m, i) => (
          <div key={`${m.studentId}-${i}`} className="tomar-marca" data-st={m.duplicado ? "dup" : m.status}>
            <span className="tomar-marca-ic">
              {m.status === "error" ? "!" : m.duplicado ? "=" : m.status === "absent" ? "—" : "✓"}
            </span>
            <div className="tomar-marca-tx">
              <span className="tomar-marca-n">{m.name}</span>
              <span className="tomar-marca-d">
                {m.status === "error" ? "No se pudo registrar"
                  : m.duplicado ? `Ya estaba registrado · ${m.time}`
                  : m.status === "absent" ? `Registrado como falta · ${m.aula}`
                  : `${m.status === "late" ? "Tardanza" : "Presente"} · ${m.time} · ${m.aula}`}
              </span>
            </div>
            {m.studentId && !m.duplicado && (
              <button className="tomar-undo" onClick={() => deshacer(m.studentId)}>Deshacer</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
