"use client"

import type { Session } from "next-auth"
import Link from "next/link"
import ModulesOrbit from "./ModulesOrbit"

const stats = [
  { label: "Estudiantes",    icon: "👩‍🎓", href: "/dashboard/admin/alumnos",            accent: "#1A33CC", bg: "#EEF2FF" },
  { label: "Docentes",       icon: "👩‍🏫", href: "/dashboard/admin/usuarios",           accent: "#0369A1", bg: "#E0F2FE" },
  { label: "Secciones",      icon: "🏫",  href: "/dashboard/admin/aulas",              accent: "#6D28D9", bg: "#EDE9FE" },
  { label: "Asistencia hoy", icon: "✅",  href: "/dashboard/academico/asistencia",     accent: "#15803D", bg: "#DCFCE7" },
]

const modules = [
  { href: "/dashboard/academico",  label: "Académico",   icon: "📚", desc: "Notas, asistencia y conducta", accent: "#1A33CC", bg: "#EEF2FF",   border: "#C7D2FE" },
  { href: "/dashboard/finanzas",   label: "Finanzas",    icon: "💰", desc: "Pagos y recaudación",          accent: "#B45309", bg: "#FFFBEB",   border: "#FDE68A", requirePayments: true },
  { href: "/dashboard/medico",     label: "Médico",      icon: "🏥", desc: "Fichas de salud",              accent: "#0369A1", bg: "#E0F2FE",   border: "#BAE6FD" },
  { href: "/dashboard/psicologia", label: "Psicología",  icon: "🧠", desc: "Casos y seguimiento",           accent: "#BE185D", bg: "#FCE7F3",   border: "#FBCFE8" },
  { href: "/dashboard/biblioteca", label: "Biblioteca",  icon: "📖", desc: "Plan lector",                  accent: "#6D28D9", bg: "#EDE9FE",   border: "#DDD6FE" },
  { href: "/dashboard/admin",      label: "Administrar", icon: "⚙️", desc: "Usuarios, grados y config",   accent: "#0D1E3A", bg: "#F1F5F9",   border: "#CBD5E1" },
  { href: "/dashboard/analitica",  label: "Analítica",   icon: "📊", desc: "Reportes e indicadores",       accent: "#15803D", bg: "#DCFCE7",   border: "#A7F3D0" },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Buenos días"
  if (h < 19) return "Buenas tardes"
  return "Buenas noches"
}

export default function DirectorDashboard({ session }: { session: Session | null }) {
  const name   = session?.user?.name?.split(" ")[0] ?? "Director"
  const role   = session?.user?.role ?? "director"
  const canViewPayments = session?.user?.canViewPayments ?? false

  const roleLabel: Record<string, string> = {
    director: "Director/a", admin: "Administrador/a",
    coordinador: "Coordinador/a", superadmin: "Super Admin",
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 40px" }}>

      {/* ── Banner de bienvenida ── */}
      <div style={{
        borderRadius: 20,
        background: "linear-gradient(135deg, #0D1E3A 0%, #1A3060 60%, #1A33CC 100%)",
        padding: "32px 36px",
        marginBottom: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        boxShadow: "0 4px 24px rgba(13,30,58,0.18)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decoración de fondo */}
        <div style={{ position:"absolute", top:-40, right:-40, width:180, height:180, borderRadius:"50%", background:"rgba(240,200,0,0.08)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-30, right:120, width:120, height:120, borderRadius:"50%", background:"rgba(71,181,232,0.07)", pointerEvents:"none" }} />

        <div style={{ position:"relative" }}>
          <p style={{ fontSize:12, fontWeight:700, letterSpacing:"0.2em", color:"rgba(240,200,0,0.85)", textTransform:"uppercase", marginBottom:8 }}>
            {roleLabel[role] ?? role} · I.E.P. Cristo Reina
          </p>
          <h1 style={{ fontSize:"clamp(22px,3vw,32px)", fontWeight:900, color:"#FFFFFF", marginBottom:6, lineHeight:1.1 }}>
            {greeting()}, {name} 👋
          </h1>
          <p style={{ fontSize:14, color:"rgba(255,255,255,0.6)", margin:0 }}>
            {new Date().toLocaleDateString("es-PE", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
          </p>
        </div>

        <div style={{ position:"relative", flexShrink:0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-cr.png" alt="" style={{ width:72, height:88, objectFit:"contain", filter:"drop-shadow(0 4px 16px rgba(240,200,0,0.25))" }} />
        </div>
      </div>

      {/* ── Tarjetas de stats ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16, marginBottom:28 }}>
        {stats.map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration:"none" }}>
            <div style={{
              background: "#FFFFFF",
              borderRadius: 16,
              padding: "20px 20px",
              border: `1px solid ${s.bg}`,
              boxShadow: "0 1px 4px rgba(13,30,58,0.06), 0 4px 16px rgba(13,30,58,0.04)",
              transition: "transform .18s, box-shadow .18s",
              cursor: "pointer",
              display:"flex", alignItems:"center", gap:16,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 24px rgba(13,30,58,0.12)` }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(13,30,58,0.06), 0 4px 16px rgba(13,30,58,0.04)" }}
            >
              <div style={{ width:48, height:48, borderRadius:12, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize:22, fontWeight:900, color:s.accent, lineHeight:1 }}>—</div>
                <div style={{ fontSize:12, color:"#64748B", fontWeight:500, marginTop:3 }}>{s.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Módulos ── */}
      <div>
        <h2 style={{ fontSize:11, fontWeight:700, letterSpacing:"0.18em", color:"#8A9ABB", textTransform:"uppercase", marginBottom:16, textAlign:"center" }}>
          Módulos del sistema
        </h2>
        <ModulesOrbit modules={modules.filter((m) => !m.requirePayments || canViewPayments)} />
      </div>

      {/* ── Acceso rápido ── */}
      <div style={{ marginTop:28, padding:"20px 24px", borderRadius:16, background:"#FFFFFF", border:"1px solid #DDE3F0", boxShadow:"0 1px 4px rgba(13,30,58,0.05)" }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.18em", color:"#8A9ABB", textTransform:"uppercase", marginBottom:14 }}>Acceso rápido</p>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          {[
            { href:"/dashboard/academico/asistencia",  label:"📋 Tomar asistencia" },
            { href:"/dashboard/admin/alumnos",         label:"👩‍🎓 Ver alumnos" },
            { href:"/dashboard/admin/noticias",        label:"📰 Publicar noticia" },
            { href:"/dashboard/admin/actividades",     label:"🎭 Nueva actividad" },
            { href:"/inicio",                          label:"🌐 Ver página pública" },
          ].map(q => (
            <Link key={q.href} href={q.href}
              style={{ display:"inline-block", padding:"8px 16px", borderRadius:10, background:"#EEF2FF", color:"#1A33CC", fontSize:13, fontWeight:600, textDecoration:"none", border:"1px solid #C7D2FE", transition:"background .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#C7D2FE" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#EEF2FF" }}
            >
              {q.label}
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
