"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function PortalCodigo() {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/portal/acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Código incorrecto")
        setLoading(false)
        return
      }
      router.push("/portal/ver")
    } catch {
      setError("Error de conexión. Intenta de nuevo.")
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0D1E3A 0%, #112448 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{ maxWidth: 400, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-cr.png"
            alt="I.E.P. Cristo Reina"
            style={{ width: 52, height: 64, objectFit: "contain", marginBottom: 18 }}
          />
          <h1 style={{ fontSize: 21, fontWeight: 800, color: "#FFFFFF", marginBottom: 4 }}>
            Portal de Apoderados
          </h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            I.E.P. Cristo Reina
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 20,
          padding: "32px 28px",
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block",
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                Código de acceso familiar
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="Ej: MK9PT3WR"
                maxLength={12}
                required
                autoComplete="off"
                style={{
                  width: "100%",
                  padding: "15px 16px",
                  borderRadius: 12,
                  border: `2px solid ${error ? "rgba(239,68,68,0.5)" : code ? "#F0C800" : "rgba(255,255,255,0.15)"}`,
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textAlign: "center",
                  color: "#FFFFFF",
                  outline: "none",
                  background: "rgba(255,255,255,0.07)",
                  fontFamily: "monospace",
                  boxSizing: "border-box",
                  transition: "border-color .15s",
                }}
              />
            </div>

            {error && (
              <div style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 10,
                padding: "10px 14px",
                marginBottom: 16,
              }}>
                <p style={{ fontSize: 13, color: "#FCA5A5", margin: 0 }}>⚠️ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: 12,
                background: loading || !code.trim() ? "rgba(240,200,0,0.3)" : "#F0C800",
                color: loading || !code.trim() ? "rgba(13,30,58,0.5)" : "#0D1E3A",
                fontWeight: 800,
                fontSize: 15,
                border: "none",
                cursor: loading || !code.trim() ? "not-allowed" : "pointer",
                transition: "background .15s",
              }}
            >
              {loading ? "Verificando..." : "Ver información de mi hijo →"}
            </button>
          </form>

          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center", marginTop: 20, lineHeight: 1.6 }}>
            ¿No tienes código? Contacta a la dirección del colegio.
          </p>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 24 }}>
          <Link href="/portal" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>← Volver</Link>
        </p>
      </div>
    </div>
  )
}
