"use client"

import Link from "next/link"
import Image from "next/image"
import { BookOpen, ClipboardList, DollarSign, Users, Heart, Book } from "lucide-react"

const MODULES = [
  {
    icon: BookOpen,
    title: "Gestión Académica",
    desc: "Notas, conducta, boletas y libros de calificaciones digitales.",
    rgb: "26,51,204",
    hex: "#1A33CC",
  },
  {
    icon: ClipboardList,
    title: "Asistencia",
    desc: "Control diario con código QR por aula y nivel educativo.",
    rgb: "71,181,232",
    hex: "#47B5E8",
  },
  {
    icon: DollarSign,
    title: "Finanzas",
    desc: "Pagos, pensiones y conceptos de cobro con historial completo.",
    rgb: "240,200,0",
    hex: "#F0C800",
  },
  {
    icon: Users,
    title: "Portal Familiar",
    desc: "Acceso para padres a notas, asistencia y comunicados.",
    rgb: "26,51,204",
    hex: "#1A33CC",
  },
  {
    icon: Heart,
    title: "Ficha Médica",
    desc: "Historial de salud, alergias, vacunas y atenciones.",
    rgb: "71,181,232",
    hex: "#47B5E8",
  },
  {
    icon: Book,
    title: "Biblioteca",
    desc: "Catálogo digital y préstamos del acervo institucional.",
    rgb: "240,200,0",
    hex: "#F0C800",
  },
]

export default function InicioPage() {
  return (
    <>
      <style>{`
        :root { --font: var(--font-geist-sans, system-ui, sans-serif); }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-14px) rotate(0.5deg); }
          66% { transform: translateY(-6px) rotate(-0.5deg); }
        }
        @keyframes glow-pulse {
          0%, 100% {
            filter:
              drop-shadow(0 0 24px rgba(240,200,0,0.35))
              drop-shadow(0 0 60px rgba(26,51,204,0.25))
              drop-shadow(0 8px 32px rgba(0,0,0,0.5));
          }
          50% {
            filter:
              drop-shadow(0 0 48px rgba(240,200,0,0.55))
              drop-shadow(0 0 100px rgba(26,51,204,0.45))
              drop-shadow(0 8px 32px rgba(0,0,0,0.5));
          }
        }
        @keyframes scan {
          0%   { background-position: 0 0; }
          100% { background-position: 0 60px; }
        }
        @keyframes border-spin {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .shield-anim {
          animation: float 6s ease-in-out infinite, glow-pulse 4s ease-in-out infinite;
          will-change: transform, filter;
        }

        .glass-card {
          background: rgba(255,255,255,0.028);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          transition: background 0.3s, border-color 0.3s, transform 0.3s, box-shadow 0.3s;
          cursor: default;
        }
        .glass-card:hover {
          background: rgba(255,255,255,0.055);
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 28px 56px rgba(0,0,0,0.4);
        }

        .btn-gold {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 15px 40px;
          border-radius: 12px;
          background: #F0C800;
          color: #020817;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          text-decoration: none;
          transition: brightness 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 0 24px rgba(240,200,0,0.35);
        }
        .btn-gold:hover {
          brightness: 1.08;
          transform: translateY(-2px);
          box-shadow: 0 0 40px rgba(240,200,0,0.55);
        }
        .btn-gold:active { transform: scale(0.97); }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 15px 40px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.85);
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          text-decoration: none;
          transition: background 0.2s, border-color 0.2s, transform 0.15s;
        }
        .btn-ghost:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.28);
          transform: translateY(-2px);
        }
        .btn-ghost:active { transform: scale(0.97); }

        .divider-glow {
          height: 1px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(240,200,0,0.5) 30%,
            rgba(71,181,232,0.5) 70%,
            transparent 100%
          );
        }

        .module-accent {
          height: 2px;
          border-radius: 1px;
          margin-top: 24px;
        }
      `}</style>

      <div style={{
        background: "#020817",
        minHeight: "100vh",
        fontFamily: "var(--font)",
        color: "white",
        position: "relative",
        overflowX: "hidden",
      }}>

        {/* ── NAV ─────────────────────────────────────────────────────── */}
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(24px)",
          background: "rgba(2,8,23,0.85)",
          borderBottom: "1px solid rgba(255,255,255,0.055)",
        }}>
          <div style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 28px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ position: "relative", width: 34, height: 42, flexShrink: 0 }}>
                <Image src="/logo-cr.svg" alt="Escudo Cristo Reina" fill style={{ objectFit: "contain" }} />
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: "0.28em",
                  color: "#F0C800",
                  textTransform: "uppercase",
                }}>I.E.P.</div>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.04em" }}>
                  Cristo Reina
                </div>
              </div>
            </div>

            <Link href="/login" className="btn-gold" style={{ padding: "9px 24px", fontSize: 13 }}>
              Iniciar sesion
            </Link>
          </div>
        </header>

        {/* ── HERO ────────────────────────────────────────────────────── */}
        <section style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 28px 80px",
          position: "relative",
          textAlign: "center",
          overflow: "hidden",
        }}>

          {/* Background grid */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: [
              "linear-gradient(rgba(26,51,204,0.12) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(26,51,204,0.12) 1px, transparent 1px)",
            ].join(", "),
            backgroundSize: "64px 64px",
            pointerEvents: "none",
          }} />

          {/* Radial center glow */}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 720,
            height: 720,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(26,51,204,0.18) 0%, rgba(71,181,232,0.08) 40%, transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* Bottom gold horizon */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent, rgba(240,200,0,0.6), rgba(71,181,232,0.4), transparent)",
          }} />

          {/* Eyebrow label */}
          <div style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: "0.3em",
            color: "rgba(240,200,0,0.8)",
            textTransform: "uppercase",
            marginBottom: 48,
          }}>
            UGEL N.&deg; 06 &bull; Ate-Vitarte, Lima &bull; Peru
          </div>

          {/* Shield */}
          <div className="shield-anim" style={{
            position: "relative",
            width: 190,
            height: 240,
            marginBottom: 52,
            flexShrink: 0,
          }}>
            <Image
              src="/logo-cr.svg"
              alt="Escudo Oficial I.E.P. Cristo Reina"
              fill
              style={{ objectFit: "contain" }}
              priority
            />
          </div>

          {/* School name */}
          <div style={{ position: "relative", marginBottom: 28 }}>
            <h1 style={{
              fontSize: "clamp(52px, 9vw, 104px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 0.92,
              margin: 0,
              color: "white",
            }}>
              CRISTO
            </h1>
            <h1 style={{
              fontSize: "clamp(52px, 9vw, 104px)",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 0.92,
              margin: 0,
              color: "#F0C800",
              textShadow: "0 0 60px rgba(240,200,0,0.35)",
            }}>
              REINA
            </h1>
          </div>

          {/* Subtitle */}
          <p style={{
            fontSize: "clamp(12px, 1.6vw, 15px)",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            marginBottom: 52,
            fontWeight: 500,
          }}>
            Plataforma Institucional de Gestion Escolar
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/login" className="btn-gold">
              Acceder al sistema
            </Link>
            <a href="#modulos" className="btn-ghost">
              Ver modulos
            </a>
          </div>
        </section>

        {/* ── MODULES ─────────────────────────────────────────────────── */}
        <section id="modulos" style={{ padding: "100px 28px" }}>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>

            {/* Section header */}
            <div style={{ marginBottom: 64, maxWidth: 560 }}>
              <h2 style={{
                fontSize: "clamp(30px, 4.5vw, 52px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                marginBottom: 20,
              }}>
                Sistema{" "}
                <span style={{ color: "#F0C800" }}>Integral</span>
              </h2>
              <p style={{
                color: "rgba(255,255,255,0.38)",
                fontSize: 16,
                lineHeight: 1.7,
                maxWidth: 480,
              }}>
                Herramientas digitales que cubren cada area de la gestion escolar, desde la academia hasta el bienestar del alumno.
              </p>
            </div>

            {/* Module grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 14,
            }}>
              {MODULES.map((mod) => (
                <div key={mod.title} className="glass-card" style={{ padding: "28px 28px 24px" }}>
                  {/* Icon */}
                  <div style={{
                    width: 46,
                    height: 46,
                    borderRadius: 14,
                    background: `rgba(${mod.rgb},0.12)`,
                    border: `1px solid rgba(${mod.rgb},0.25)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 20,
                  }}>
                    <mod.icon size={20} color={mod.hex} strokeWidth={1.8} />
                  </div>

                  <h3 style={{
                    fontWeight: 700,
                    fontSize: 15.5,
                    letterSpacing: "-0.01em",
                    marginBottom: 8,
                  }}>
                    {mod.title}
                  </h3>
                  <p style={{
                    color: "rgba(255,255,255,0.38)",
                    fontSize: 13.5,
                    lineHeight: 1.65,
                  }}>
                    {mod.desc}
                  </p>

                  {/* Bottom accent bar */}
                  <div className="module-accent" style={{
                    background: `linear-gradient(90deg, rgba(${mod.rgb},0.7), transparent)`,
                  }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DIVIDER ─────────────────────────────────────────────────── */}
        <div className="divider-glow" />

        {/* ── INFO BAND ───────────────────────────────────────────────── */}
        <section style={{
          padding: "72px 28px",
          background: "rgba(26,51,204,0.06)",
        }}>
          <div style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 48,
            textAlign: "center",
          }}>
            {[
              { label: "Institucion", value: "I.E.P. Cristo Reina", sub: "Educacion Inicial, Primaria y Secundaria" },
              { label: "Dependencia",  value: "UGEL N.° 06",         sub: "Ate-Vitarte, Lima, Peru" },
              { label: "Acceso",       value: "Solo autorizado",     sub: "Contacta a direccion para credenciales" },
            ].map((item) => (
              <div key={item.label}>
                <div style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.28em",
                  color: "#F0C800",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}>
                  {item.label}
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em", marginBottom: 6 }}>
                  {item.value}
                </div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, lineHeight: 1.5 }}>
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DIVIDER ─────────────────────────────────────────────────── */}
        <div className="divider-glow" />

        {/* ── CTA FINAL ───────────────────────────────────────────────── */}
        <section style={{
          padding: "100px 28px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(240,200,0,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{
            position: "relative",
            width: 80,
            height: 100,
            margin: "0 auto 32px",
          }}>
            <Image src="/logo-cr.svg" alt="Escudo" fill style={{ objectFit: "contain", opacity: 0.85 }} />
          </div>

          <h2 style={{
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}>
            Listo para ingresar?
          </h2>
          <p style={{
            color: "rgba(255,255,255,0.38)",
            fontSize: 15,
            marginBottom: 40,
            maxWidth: 420,
            margin: "0 auto 40px",
            lineHeight: 1.6,
          }}>
            Accede con tus credenciales institucionales para gestionar el colegio.
          </p>
          <Link href="/login" className="btn-gold">
            Acceder ahora
          </Link>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <footer style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "28px 28px",
          background: "rgba(0,0,0,0.3)",
        }}>
          <div style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative", width: 26, height: 32, flexShrink: 0 }}>
                <Image src="/logo-cr.svg" alt="Logo" fill style={{ objectFit: "contain" }} />
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                I.E.P. Cristo Reina &bull; UGEL 06 Ate-Vitarte
              </span>
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.18)" }}>
              &copy; 2026 I.E.P. Cristo Reina. Todos los derechos reservados.
            </span>
          </div>
        </footer>

      </div>
    </>
  )
}
