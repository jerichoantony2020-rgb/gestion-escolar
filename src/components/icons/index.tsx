import type { ReactElement, SVGProps } from "react"

/**
 * Sistema de íconos de línea de la plataforma.
 * Todos comparten viewBox 24, trazo 1.5, extremos redondeados y `currentColor`,
 * para que se lean como una sola familia en cualquier tamaño o color.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string }

function Svg({ size = 24, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconAcademico = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4.5 2.5 9 12 13.5 21.5 9 12 4.5Z" />
    <path d="M6.5 11.2v4.4c0 1.5 2.5 2.7 5.5 2.7s5.5-1.2 5.5-2.7v-4.4" />
    <path d="M21.5 9v4.6" />
  </Svg>
)

export const IconFinanzas = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 8.5V6.8A1.8 1.8 0 0 0 17.2 5H5.5A2.5 2.5 0 0 0 3 7.5v9A2.5 2.5 0 0 0 5.5 19h11.7a1.8 1.8 0 0 0 1.8-1.8V15.5" />
    <path d="M21 8.5h-4a3.5 3.5 0 0 0 0 7h4a.5.5 0 0 0 .5-.5v-6a.5.5 0 0 0-.5-.5Z" />
    <path d="M16.8 12h.01" />
  </Svg>
)

export const IconMedico = (p: IconProps) => (
  <Svg {...p}>
    <path d="M19 14c1.5-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    <path d="M3.4 13h6L10 12l2 4.5 2-7 1.5 3.5h5.1" />
  </Svg>
)

export const IconPsicologia = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5.6v12.8" />
    <path d="M12 7.2a2.6 2.6 0 0 0-4.8-1.35A2.4 2.4 0 0 0 4.7 8.4a2.5 2.5 0 0 0-.4 4.5 2.6 2.6 0 0 0 1.5 4 2.5 2.5 0 0 0 3.8 2 2.5 2.5 0 0 0 2.4-1.6" />
    <path d="M12 7.2a2.6 2.6 0 0 1 4.8-1.35A2.4 2.4 0 0 1 19.3 8.4a2.5 2.5 0 0 1 .4 4.5 2.6 2.6 0 0 1-1.5 4 2.5 2.5 0 0 1-3.8 2 2.5 2.5 0 0 1-2.4-1.6" />
  </Svg>
)

export const IconBiblioteca = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 7.6C10.4 6.2 8 5.6 4.6 5.6v11c3.4 0 5.8.6 7.4 2" />
    <path d="M12 7.6c1.6-1.4 4-2 7.4-2v11c-3.4 0-5.8.6-7.4 2" />
    <path d="M12 7.6v11" />
  </Svg>
)

export const IconAdmin = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8h6M14.6 8H20M4 16h3.4M12.1 16H20" />
    <circle cx="12.3" cy="8" r="2.3" />
    <circle cx="9.7" cy="16" r="2.3" />
  </Svg>
)

export const IconAnalitica = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 19.5h16" />
    <path d="M7.6 19.5v-5.6M12 19.5V9.6M16.4 19.5v-3.4" />
  </Svg>
)

export const IconEstudiantes = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15.4 19.6V18a3.4 3.4 0 0 0-3.4-3.4H6.9A3.4 3.4 0 0 0 3.5 18v1.6" />
    <circle cx="9.45" cy="7.9" r="3.4" />
    <path d="M20.5 19.6V18a3.4 3.4 0 0 0-2.6-3.3M15.6 4.7a3.4 3.4 0 0 1 0 6.5" />
  </Svg>
)

export const IconDocentes = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 4.5h17" />
    <path d="M4.9 4.5v9.1a1.4 1.4 0 0 0 1.4 1.4h11.4a1.4 1.4 0 0 0 1.4-1.4V4.5" />
    <path d="M12 15v4.5M9.2 19.5h5.6" />
    <path d="M8.6 11.4 11 9l2 2 2.4-3" />
  </Svg>
)

export const IconSecciones = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.7" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.7" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.7" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.7" />
  </Svg>
)

export const IconAsistencia = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.3 12.2 2.5 2.5 4.9-5.2" />
  </Svg>
)

export const IconTomarAsistencia = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.2 4.6H7.5A1.5 1.5 0 0 0 6 6.1V19a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V6.1a1.5 1.5 0 0 0-1.5-1.5h-1.7" />
    <rect x="9.2" y="2.9" width="5.6" height="3.4" rx="1.1" />
    <path d="m9.5 13.2 1.8 1.8 3.4-3.8" />
  </Svg>
)

export const IconNoticia = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6.6A1.6 1.6 0 0 1 5.6 5h9.8A1.6 1.6 0 0 1 17 6.6v10.9a1.5 1.5 0 0 0 1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" />
    <path d="M17 9h1.4A1.6 1.6 0 0 1 20 10.6v6.9a1.5 1.5 0 0 1-1.5 1.5" />
    <path d="M7.2 8.6h6.6M7.2 11.6h6.6M7.2 14.6h4" />
  </Svg>
)

export const IconActividad = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
    <path d="M3.5 9.6h17M8.2 3.5v3.2M15.8 3.5v3.2" />
  </Svg>
)

export const IconGlobo = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17" />
    <path d="M12 3.5a13.4 13.4 0 0 1 0 17 13.4 13.4 0 0 1 0-17Z" />
  </Svg>
)

export type IconComponent = (props: IconProps) => ReactElement

export type IconName =
  | "academico" | "finanzas" | "medico" | "psicologia" | "biblioteca"
  | "admin" | "analitica" | "estudiantes" | "docentes" | "secciones"
  | "asistencia" | "tomarAsistencia" | "noticia" | "actividad" | "globo"

export const MODULE_ICONS: Record<IconName, IconComponent> = {
  academico: IconAcademico,
  finanzas: IconFinanzas,
  medico: IconMedico,
  psicologia: IconPsicologia,
  biblioteca: IconBiblioteca,
  admin: IconAdmin,
  analitica: IconAnalitica,
  estudiantes: IconEstudiantes,
  docentes: IconDocentes,
  secciones: IconSecciones,
  asistencia: IconAsistencia,
  tomarAsistencia: IconTomarAsistencia,
  noticia: IconNoticia,
  actividad: IconActividad,
  globo: IconGlobo,
}
