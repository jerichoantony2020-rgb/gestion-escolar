"use client"

import Link from "next/link"

export type OrbitModule = {
  href: string
  label: string
  icon: string
  desc: string
  accent: string
  bg: string
}

/**
 * Selector circular de módulos: nodos distribuidos en órbita alrededor de un
 * hub central, unidos por líneas degradadas. En pantallas pequeñas cae a una
 * grilla simple (una órbita no cabe legible en un celular).
 */
export default function ModulesOrbit({ modules }: { modules: OrbitModule[] }) {
  const n = modules.length

  return (
    <div>
      {/* ── Desktop / tablet: órbita ── */}
      <div
        className="hidden sm:block relative mx-auto orbit-fade-in"
        style={{
          width: "clamp(360px, 46vw, 560px)",
          height: "clamp(360px, 46vw, 560px)",
          ["--r" as string]: "clamp(130px, 20vw, 210px)",
        }}
      >
        {/* Anillos decorativos */}
        <div className="orbit-ring-spin" style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: "1px dashed rgba(26,51,204,0.16)",
        }} />
        <div style={{
          position: "absolute", inset: "14%", borderRadius: "50%",
          border: "1px solid rgba(26,51,204,0.08)",
        }} />

        {/* Líneas radiales (spokes) */}
        {modules.map((m, i) => {
          const angle = (360 / n) * i - 90
          return (
            <div
              key={m.href + "-line"}
              style={{
                position: "absolute", top: "50%", left: "50%",
                width: "var(--r)", height: 2,
                transformOrigin: "0 0",
                transform: `rotate(${angle}deg)`,
                background: `linear-gradient(to right, transparent, ${m.accent}55 55%, ${m.accent}99)`,
                pointerEvents: "none",
              }}
            />
          )
        })}

        {/* Hub central */}
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: "clamp(84px,10vw,108px)", height: "clamp(84px,10vw,108px)",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0D1E3A 0%, #1A33CC 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 0 6px rgba(26,51,204,0.08), 0 8px 28px rgba(13,30,58,0.28)",
          zIndex: 2,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-cr.png" alt="" style={{ width: "48%", height: "48%", objectFit: "contain", filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" }} />
        </div>

        {/* Nodos */}
        {modules.map((m, i) => {
          const angle = (360 / n) * i - 90
          return (
            // Capa 1: posiciona el nodo en la órbita (rotar + empujar hacia afuera). Sin animación aquí.
            <div
              key={m.href}
              style={{
                position: "absolute", top: "50%", left: "50%",
                transformOrigin: "0 0",
                transform: `rotate(${angle}deg) translateX(var(--r))`,
                zIndex: 3,
              }}
            >
              {/* Capa 2: contrarrota para que el contenido quede derecho, y centra sobre el punto. */}
              <div style={{ transform: `translate(-50%,-50%) rotate(${-angle}deg)` }}>
                {/* Capa 3: animación de aparición (scale/opacity) — separada para no pisar las capas 1-2. */}
                <div className="orbit-node-in" style={{ animationDelay: `${i * 70}ms` }}>
                  <Link href={m.href} className="orbit-node group" style={{ textDecoration: "none" }}>
                    <div
                      className="orbit-node-circle"
                      style={{
                        background: `linear-gradient(155deg, #FFFFFF 0%, ${m.bg} 100%)`,
                        boxShadow: `0 2px 8px rgba(13,30,58,0.08), 0 0 0 1px ${m.accent}22`,
                      }}
                    >
                      <span style={{ fontSize: "clamp(20px,2.4vw,26px)" }}>{m.icon}</span>
                    </div>
                    <span className="orbit-node-label" style={{ color: "#0D1E3A" }}>{m.label}</span>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Mobile: grilla simple ── */}
      <div className="sm:hidden grid grid-cols-2 gap-3">
        {modules.map((m) => (
          <Link key={m.href} href={m.href} style={{ textDecoration: "none" }}>
            <div style={{
              background: "#FFFFFF", borderRadius: 16, padding: "16px 14px",
              border: `1px solid ${m.accent}22`, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 8, textAlign: "center",
              boxShadow: "0 1px 4px rgba(13,30,58,0.05)",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", background: m.bg,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
              }}>
                {m.icon}
              </div>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#0D1E3A" }}>{m.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
