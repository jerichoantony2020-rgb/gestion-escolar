"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { MODULE_ICONS, type IconName } from "@/components/icons"

interface DockItem {
  href: string
  label: string
  icon: IconName
  roles?: string[]
  requirePayments?: boolean
}

const items: DockItem[] = [
  { href: "/dashboard",            label: "Inicio",      icon: "inicio" },
  { href: "/dashboard/academico",  label: "Académico",   icon: "academico",  roles: ["director", "docente", "coordinador"] },
  { href: "/dashboard/portal",     label: "Portal",      icon: "portal",     roles: ["padre"] },
  { href: "/dashboard/finanzas",   label: "Finanzas",    icon: "finanzas",   requirePayments: true },
  { href: "/dashboard/medico",     label: "Médico",      icon: "medico",     roles: ["director", "coordinador", "enfermera"] },
  { href: "/dashboard/psicologia", label: "Psicología",  icon: "psicologia", roles: ["director", "coordinador", "psicologo", "docente"] },
  { href: "/dashboard/biblioteca", label: "Biblioteca",  icon: "biblioteca", roles: ["director", "coordinador", "docente", "enfermera", "admin"] },
  { href: "/dashboard/admin",      label: "Admin",       icon: "admin",      roles: ["director", "admin"] },
]

export default function Dock() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role ?? ""
  const canViewPayments = session?.user?.canViewPayments ?? false

  const visible = items.filter((item) => {
    if (item.requirePayments && !canViewPayments) return false
    if (item.roles && !item.roles.includes(role)) return false
    return true
  })

  return (
    <>
      {/* ── Desktop top bar ── */}
      <nav
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center gap-1 px-4 h-14"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(26,51,204,0.10)",
          boxShadow: "0 1px 12px rgba(13,30,58,0.08)",
        }}
      >
        {/* Brand */}
        <Link href="/dashboard" className="flex items-center gap-2.5 mr-5 select-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-cr.png"
            alt="I.E.P. Cristo Reina"
            width={30}
            height={36}
            style={{ objectFit: "contain", width: 30, height: 36 }}
          />
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: "#1A33CC", textTransform: "uppercase" }}>I.E.P.</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#0D1E3A", lineHeight: 1 }}>Cristo Reina</div>
          </div>
        </Link>

        {/* Separator */}
        <div style={{ width: 1, height: 24, background: "rgba(13,30,58,0.12)", marginRight: 4 }} />

        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = MODULE_ICONS[item.icon]
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={active
                ? { background: "#0D1E3A", color: "#FFFFFF", boxShadow: "0 2px 8px rgba(13,30,58,0.25)" }
                : { color: "#5A6A8A" }
              }
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#EEF2FF" }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "" }}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0D1E3A" }}>{session?.user?.name}</div>
            <div style={{ fontSize: 10, color: "#5A6A8A", textTransform: "capitalize" }}>{role}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: "1px solid #DDE3F0", color: "#5A6A8A", background: "transparent", cursor: "pointer",
              transition: "all .15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#FEE2E2"; (e.currentTarget as HTMLElement).style.color = "#DC2626"; (e.currentTarget as HTMLElement).style.borderColor = "#FECACA" }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "#5A6A8A"; (e.currentTarget as HTMLElement).style.borderColor = "#DDE3F0" }}
          >
            Salir
          </button>
        </div>
      </nav>

      {/* ── Mobile top bar ── */}
      <nav
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-12"
        style={{
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(26,51,204,0.10)",
          boxShadow: "0 1px 8px rgba(13,30,58,0.07)",
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-cr.png" alt="" width={22} height={28} style={{ objectFit: "contain", width: 22, height: 28 }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: "#0D1E3A" }}>
            {session?.user?.name?.split(" ")[0] ?? "Cristo Reina"}
          </span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
            border: "1px solid #DDE3F0", color: "#5A6A8A", background: "transparent", cursor: "pointer",
          }}
        >
          Salir
        </button>
      </nav>

      {/* ── Mobile bottom dock ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-safe pt-1"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(26,51,204,0.10)",
          boxShadow: "0 -2px 16px rgba(13,30,58,0.07)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 6px)",
          paddingTop: 6,
        }}
      >
        {visible.slice(0, 5).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = MODULE_ICONS[item.icon]
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
              style={active
                ? { background: "#EEF2FF", color: "#1A33CC" }
                : { color: "#8A9ABB" }
              }
            >
              <Icon size={21} />
              <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
