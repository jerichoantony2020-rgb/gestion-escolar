import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })

export const metadata: Metadata = {
  title: "I.E.P Cristo Reina — Plataforma Institucional",
  description: "Sistema de gestión académica para I.E.P Cristo Reina, Ate-Vitarte, Lima.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geist.variable} min-h-screen antialiased`}>
        {children}
      </body>
    </html>
  )
}
