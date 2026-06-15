"use client"

import Link from "next/link"

export default function PortalSeleccion() {
  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0D1E3A 0%, #112448 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{ maxWidth: 480, width: "100%" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-cr.png"
            alt="I.E.P. Cristo Reina"
            style={{ width: 60, height: 72, objectFit: "contain", marginBottom: 20 }}
          />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#FFFFFF", marginBottom: 6 }}>
            Portal I.E.P. Cristo Reina
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", margin: 0 }}>
            Selecciona cómo deseas ingresar
          </p>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Padre de familia */}
          <Link href="/portal/codigo" style={{ textDecoration: "none" }}>
            <div style={{
              background: "rgba(240,200,0,0.08)",
              border: "1px solid rgba(240,200,0,0.35)",
              borderRadius: 16,
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              gap: 20,
              cursor: "pointer",
              transition: "background .2s, border-color .2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(240,200,0,0.14)"
              ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(240,200,0,0.55)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(240,200,0,0.08)"
              ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(240,200,0,0.35)"
            }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(240,200,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                👨‍👩‍👧
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 4 }}>
                  Soy apoderado
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
                  Ingresa con tu código de acceso para ver notas, asistencia y pagos
                </div>
              </div>
              <div style={{ color: "#F0C800", fontSize: 18, flexShrink: 0 }}>→</div>
            </div>
          </Link>

          {/* Personal del colegio */}
          <Link href="/login" style={{ textDecoration: "none" }}>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 16,
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              gap: 20,
              cursor: "pointer",
              transition: "background .2s, border-color .2s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"
              ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.22)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"
              ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"
            }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                🏫
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 4 }}>
                  Soy personal del colegio
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
                  Docente, director o administrativo — ingresa con tu correo y contraseña
                </div>
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 18, flexShrink: 0 }}>→</div>
            </div>
          </Link>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 32 }}>
          <Link href="/inicio" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>← Volver al inicio</Link>
        </p>
      </div>
    </div>
  )
}
