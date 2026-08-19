"use client"

import Link from "next/link"
import { MODULE_ICONS, type IconName } from "@/components/icons"

export type OrbitModule = {
  href: string
  label: string
  icon: IconName
  desc: string
  accent: string
  bg: string
}

/**
 * Selector circular de módulos: nodos en órbita alrededor de un hub central,
 * sobre un dial de marcas finas. En pantallas pequeñas cae a una lista en
 * grilla, donde una órbita no sería legible ni tocable.
 */
export default function ModulesOrbit({ modules }: { modules: OrbitModule[] }) {
  const n = modules.length

  return (
    <div>
      {/* ── Desktop / tablet: órbita ── */}
      <div
        className="hidden sm:block relative mx-auto orbit-stage"
        style={{
          width: "clamp(380px, 48vw, 580px)",
          height: "clamp(380px, 48vw, 580px)",
          ["--r" as string]: "clamp(140px, 21vw, 224px)",
        }}
      >
        {/* Dial de marcas finas (instrumento) */}
        <div className="orbit-dial" aria-hidden="true" />
        {/* Anillo interior tenue */}
        <div className="orbit-inner-ring" aria-hidden="true" />

        {/* Radios */}
        {modules.map((m, i) => {
          const angle = (360 / n) * i - 90
          return (
            <div
              key={m.href + "-spoke"}
              aria-hidden="true"
              className="orbit-spoke"
              style={{
                transform: `rotate(${angle}deg)`,
                background: `linear-gradient(to right, transparent 12%, ${m.accent}22 45%, ${m.accent}66 100%)`,
              }}
            />
          )
        })}

        {/* Hub central */}
        <div className="orbit-hub">
          <div className="orbit-hub-core">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-cr.png" alt="" className="orbit-hub-logo" />
          </div>
        </div>

        {/* Nodos */}
        {modules.map((m, i) => {
          const angle = (360 / n) * i - 90
          const Icon = MODULE_ICONS[m.icon]
          return (
            // Capa 1 — posiciona sobre la circunferencia.
            <div
              key={m.href}
              className="orbit-slot"
              style={{ transform: `rotate(${angle}deg) translateX(var(--r))` }}
            >
              {/* Capa 2 — contrarrota para dejar el contenido derecho y lo centra. */}
              <div style={{ transform: `translate(-50%,-50%) rotate(${-angle}deg)` }}>
                {/* Capa 3 — animación de entrada, aislada de las transformaciones de posición. */}
                <div className="orbit-enter" style={{ animationDelay: `${80 + i * 60}ms` }}>
                  <Link
                    href={m.href}
                    className="orbit-node"
                    style={{
                      ["--accent" as string]: m.accent,
                      ["--soft" as string]: m.bg,
                      ["--ring" as string]: `${m.accent}2E`,
                      ["--glow" as string]: `${m.accent}40`,
                    }}
                  >
                    <span className="orbit-node-circle">
                      <Icon className="orbit-node-icon" />
                    </span>
                    <span className="orbit-node-label">{m.label}</span>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Móvil: grilla ── */}
      <div className="sm:hidden grid grid-cols-2 gap-3">
        {modules.map((m) => {
          const Icon = MODULE_ICONS[m.icon]
          return (
            <Link
              key={m.href}
              href={m.href}
              className="orbit-tile"
              style={{
                ["--accent" as string]: m.accent,
                ["--soft" as string]: m.bg,
                ["--ring" as string]: `${m.accent}2E`,
              }}
            >
              <span className="orbit-tile-icon"><Icon size={22} /></span>
              <span className="orbit-tile-label">{m.label}</span>
              <span className="orbit-tile-desc">{m.desc}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
