"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"

interface DockItem {
  href: string
  label: string
  icon: string
  roles?: string[]
  requirePayments?: boolean
}

const items: DockItem[] = [
  { href: "/dashboard",           label: "Inicio",      icon: "🏠" },
  { href: "/dashboard/academico", label: "Académico",   icon: "📚", roles: ["director", "docente", "coordinador"] },
  { href: "/dashboard/portal",    label: "Portal",      icon: "👨‍👩‍👧", roles: ["padre"] },
  { href: "/dashboard/finanzas",  label: "Finanzas",    icon: "💰", requirePayments: true },
  { href: "/dashboard/medico",    label: "Médico",      icon: "🏥", roles: ["director", "coordinador", "enfermera"] },
  { href: "/dashboard/biblioteca",label: "Biblioteca",  icon: "📖" },
  { href: "/dashboard/admin",     label: "Admin",       icon: "⚙️", roles: ["director", "admin"] },
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
      {/* Desktop: top bar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center gap-1 px-4 h-14 border-b backdrop-blur-sm"
        style={{ background: "color-mix(in srgb, var(--surface) 90%, transparent)", borderColor: "var(--border)" }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold">
            CR
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>Cristo Reina</span>
        </div>

        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-primary-500 text-white"
                  : "hover:bg-primary-50 text-[var(--muted)] hover:text-primary-600"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {session?.user?.name}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            Salir
          </button>
        </div>
      </nav>

      {/* Mobile: top bar with brand + salir */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-12 border-b backdrop-blur-sm"
        style={{ background: "color-mix(in srgb, var(--surface) 92%, transparent)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white text-[10px] font-bold">CR</div>
          <span className="text-sm font-semibold truncate max-w-[140px]" style={{ color: "var(--fg)" }}>{session?.user?.name?.split(" ")[0] ?? "Cristo Reina"}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="px-3 py-1 rounded-lg text-xs font-medium border hover:bg-red-50 hover:text-red-600 transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          Salir
        </button>
      </nav>

      {/* Mobile: bottom dock */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 pb-safe pt-2 border-t"
        style={{ background: "color-mix(in srgb, var(--surface) 95%, transparent)", borderColor: "var(--border)" }}
      >
        {visible.slice(0, 5).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors ${
                active ? "text-primary-500" : "text-[var(--muted)]"
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
