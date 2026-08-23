import type { Metadata, Viewport } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0D1E3A",
}

export const metadata: Metadata = {
  title: "I.E.P. Cristo Reina — Plataforma Institucional",
  description: "Institución Educativa Particular Cristo Reina, Ate, Lima. Formando personas íntegras con valores, conocimiento y vocación de servicio.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geist.variable} min-h-screen antialiased`}>
        {/*
          THESIS: La plataforma no imita ningún objeto. Es software de producto
          contemporáneo: el dato manda y el cromo desaparece. Rechaza el fondo
          teñido de azul y la sombra difusa que delatan al panel escolar genérico.
          OWN-WORLD: Papel neutro casi blanco, jerarquía por peso tipográfico y
          hairlines de 1px, no por sombras. Azul institucional reservado a la
          acción y al foco. Oro del escudo solo en la marca. Numerales tabulares.
          STORY: El apoderado entiende cómo va su hijo en un vistazo; el docente
          registra sin buscar el botón.
          FIRST VIEWPORT: Cabecera con el escudo y el nombre; debajo, el dato
          principal a escala grande sobre papel neutro; la acción primaria fija.
          FORM: Estándar de la categoría ejecutado a fidelidad plena (Linear,
          Notion, Vercel, Apple como vara). Elegido por el usuario tras dos
          tiradas; candidata 5, seed 8c719b47, salida canon tomada.
          FINISH: unreviewed and undocumented is unfinished; this build ends with
          the finish review, the verdict, DESIGN.md, and every shipping raster
          carrying its provenance.
        */}
        {children}
      </body>
    </html>
  )
}
