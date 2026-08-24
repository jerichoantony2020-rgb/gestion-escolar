import Link from "next/link"
import { MODULE_ICONS, type IconName } from "@/components/icons"

const secciones: { href: string; label: string; desc: string; icon: IconName; tile: string }[] = [
  { href: "/dashboard/academico/notas-area", label: "Registro de notas", desc: "Notas por competencia en escala MINEDU (AD / A / B / C)", icon: "notas", tile: "#1B47D6" },
  { href: "/dashboard/academico/asistencia", label: "Asistencia",        desc: "Control diario con código QR y consolidado por bimestre",   icon: "asistencia", tile: "#15803D" },
  { href: "/dashboard/academico/conducta",   label: "Conducta",          desc: "Códigos del reglamento y puntaje del bimestre",             icon: "conducta", tile: "#A5540A" },
  { href: "/dashboard/academico/boletin",    label: "Consultar notas",   desc: "Busca un alumno y abre su libreta o su detalle numérico",   icon: "academico", tile: "#0E7490" },
]

function Chevron() {
  return (
    <svg className="index-row-go" width="19" height="19" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export default function AcademicoPage() {
  return (
    <>
      <div className="brand-field page-head">
        <div className="page-head-inner">
          <Link href="/dashboard" className="page-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Inicio
          </Link>
          <h1>Académico</h1>
          <p>Notas, asistencia y conducta</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 48px" }}>
        <div className="index-list">
          {secciones.map(s => {
            const Icon = MODULE_ICONS[s.icon]
            return (
              <Link key={s.href} href={s.href} className="index-row"
                style={{ ["--tile" as string]: s.tile }}>
                <span className="tile"><Icon size={21} /></span>
                <span style={{ minWidth: 0 }}>
                  <span className="index-row-name" style={{ display: "block" }}>{s.label}</span>
                  <span className="index-row-desc" style={{ display: "block" }}>{s.desc}</span>
                </span>
                <Chevron />
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
