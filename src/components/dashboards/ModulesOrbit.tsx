import Link from "next/link"
import { MODULE_ICONS, type IconName } from "@/components/icons"

export type ConstelModule = {
  href: string
  label: string
  desc: string
  icon: IconName
  /** Color propio del módulo, para distinguirlos sin leer la etiqueta. */
  hue: string
  /** Marca el módulo destacado con el oro del escudo. */
  active?: boolean
}

/** Ángulos en grados desde arriba, en sentido horario. */
const ANGLES = [-90, -30, 30, 90, 150, 210]
const R = 215

function posicion(i: number, total: number) {
  const a = total === ANGLES.length ? ANGLES[i] : -90 + (360 / total) * i
  const rad = (a * Math.PI) / 180
  return { x: Math.round(R * Math.cos(rad)), y: Math.round(R * Math.sin(rad)) }
}

/**
 * Navegación de módulos en constelación. La geometría es exacta y no gira:
 * los anillos y radios están quietos y solo el puntero produce movimiento.
 */
export default function ModulesOrbit({ modules }: { modules: ConstelModule[] }) {
  const n = modules.length

  return (
    <div className="constel">
      <div className="constel-h">
        <span className="constel-k">Módulos del sistema</span>
      </div>

      {/* Escritorio */}
      <div className="stage">
        <svg className="stage-grid" viewBox="0 0 600 600" aria-hidden="true">
          <circle cx="300" cy="300" r={R} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="1" />
          <circle cx="300" cy="300" r="145" fill="none" stroke="rgba(255,255,255,.10)" strokeWidth="1" />
          <g stroke="rgba(255,255,255,.16)" strokeWidth="1">
            {modules.map((m, i) => {
              const a = ((n === ANGLES.length ? ANGLES[i] : -90 + (360 / n) * i) * Math.PI) / 180
              return (
                <line key={m.href}
                  x1={300 + 74 * Math.cos(a)} y1={300 + 74 * Math.sin(a)}
                  x2={300 + 178 * Math.cos(a)} y2={300 + 178 * Math.sin(a)} />
              )
            })}
          </g>
          {/* Marcas sobre el anillo, una por módulo */}
          <g stroke="rgba(255,255,255,.2)" strokeWidth="1">
            {modules.map((m, i) => {
              const a = (((n === ANGLES.length ? ANGLES[i] : -90 + (360 / n) * i) + 30) * Math.PI) / 180
              return (
                <line key={m.href}
                  x1={300 + (R - 8) * Math.cos(a)} y1={300 + (R - 8) * Math.sin(a)}
                  x2={300 + R * Math.cos(a)} y2={300 + R * Math.sin(a)} />
              )
            })}
          </g>
        </svg>

        <div className="hub">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hub-logo" src="/logo-cr.png" alt="Escudo I.E.P. Cristo Reina" />
        </div>

        {modules.map((m, i) => {
          const { x, y } = posicion(i, n)
          const Icon = MODULE_ICONS[m.icon]
          return (
            <Link key={m.href} href={m.href} className="cnode"
              data-on={m.active ? "" : undefined}
              style={{
                left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`,
                ["--hue" as string]: m.hue,
                ["--ring" as string]: `color-mix(in srgb, ${m.hue} 45%, transparent)`,
              }}>
              <span className="cnode-disc"><Icon size={26} /></span>
              <span className="cnode-text">
                <span className="cnode-label">{m.label}</span>
                <span className="cnode-desc">{m.desc}</span>
              </span>
            </Link>
          )
        })}
      </div>

      {/* Móvil */}
      <div className="constel-mob">
        {modules.map(m => {
          const Icon = MODULE_ICONS[m.icon]
          return (
            <Link key={m.href} href={m.href} className="cnode"
              data-on={m.active ? "" : undefined}
              style={{
                ["--hue" as string]: m.hue,
                ["--ring" as string]: `color-mix(in srgb, ${m.hue} 45%, transparent)`,
              }}>
              <span className="cnode-disc"><Icon size={26} /></span>
              <span className="cnode-label">{m.label}</span>
              <span className="cnode-desc">{m.desc}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
