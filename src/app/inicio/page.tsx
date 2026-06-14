"use client"

import Link from "next/link"
import Image from "next/image"

export default function InicioPage() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy:      #0D1E3A;
          --navy-mid:  #112448;
          --navy-lite: #1A3060;
          --gold:      #F0C800;
          --gold-dim:  rgba(240,200,0,0.18);
          --white:     #FFFFFF;
          --text-dim:  rgba(255,255,255,0.62);
          --text-faint:rgba(255,255,255,0.38);
          --border:    rgba(255,255,255,0.08);
          --font: var(--font-geist-sans, system-ui, sans-serif);
        }

        @keyframes floatShield {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        .shield { animation: floatShield 5s ease-in-out infinite; }

        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(240,200,0,0.45), rgba(71,181,232,0.3), transparent);
        }

        .card {
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px;
          transition: background .25s, border-color .25s;
        }
        .card:hover { background: rgba(255,255,255,0.07); border-color: rgba(240,200,0,0.25); }

        .nivel-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 28px 24px;
          text-align: center;
          transition: background .25s, border-color .25s, transform .25s;
        }
        .nivel-card:hover { background: rgba(255,255,255,0.07); border-color: rgba(240,200,0,0.3); transform: translateY(-4px); }

        .btn-primary {
          display: inline-block;
          padding: 14px 36px;
          border-radius: 10px;
          background: var(--gold);
          color: var(--navy);
          font-weight: 800;
          font-size: 15px;
          text-decoration: none;
          transition: opacity .2s, transform .15s;
        }
        .btn-primary:hover { opacity: .9; transform: translateY(-2px); }

        .contact-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px 0;
          border-bottom: 1px solid var(--border);
        }
        .contact-item:last-child { border-bottom: none; }
        .contact-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: var(--gold-dim);
          border: 1px solid rgba(240,200,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 20px;
        }

        section { font-family: var(--font); }
      `}</style>

      <div style={{ background: "var(--navy)", minHeight: "100vh", color: "var(--white)", fontFamily: "var(--font)" }}>

        {/* ── NAVEGACIÓN ────────────────────────────────────────────── */}
        <header style={{
          position: "sticky", top: 0, zIndex: 100,
          backdropFilter: "blur(20px)",
          background: "rgba(13,30,58,0.92)",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative", width: 32, height: 40, flexShrink: 0 }}>
                <Image src="/logo-cr.svg" alt="Escudo I.E.P. Cristo Reina" fill style={{ objectFit: "contain" }} />
              </div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", color: "var(--gold)", textTransform: "uppercase" }}>I.E.P.</div>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.03em" }}>Cristo Reina</div>
              </div>
            </div>
            <Link href="/login" style={{
              padding: "8px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: 600,
              textDecoration: "none", transition: "border-color .2s, background .2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(240,200,0,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.background = "transparent"; }}
            >
              Acceso personal
            </Link>
          </div>
        </header>

        {/* ── HERO ──────────────────────────────────────────────────── */}
        <section style={{
          minHeight: "100dvh",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "80px 24px",
          background: "linear-gradient(160deg, #0D1E3A 0%, #112448 60%, #0D1E3A 100%)",
          position: "relative", overflow: "hidden",
        }}>
          {/* Glow background */}
          <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(26,48,96,0.6) 0%, transparent 70%)", pointerEvents: "none" }} />

          {/* Escudo */}
          <div className="shield" style={{ position: "relative", width: 160, height: 200, marginBottom: 36,
            filter: "drop-shadow(0 8px 32px rgba(240,200,0,0.22)) drop-shadow(0 0 60px rgba(17,36,72,0.8))" }}>
            <Image src="/logo-cr.svg" alt="Escudo I.E.P. Cristo Reina" fill style={{ objectFit: "contain" }} priority />
          </div>

          {/* Nombre */}
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.28em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 14 }}>
            Institución Educativa Particular
          </p>
          <h1 style={{ fontSize: "clamp(38px, 6vw, 72px)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: 20 }}>
            Cristo Reina
          </h1>
          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "var(--text-dim)", maxWidth: 520, lineHeight: 1.7, marginBottom: 40 }}>
            Formando personas íntegras con valores, conocimiento y vocación de servicio en Ate-Vitarte, Lima.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <a href="#nosotros" className="btn-primary">Conoce el colegio</a>
            <a href="#contacto" style={{
              display: "inline-block", padding: "14px 36px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)",
              fontSize: 15, fontWeight: 600, textDecoration: "none",
              transition: "border-color .2s, background .2s",
            }}>Contáctanos</a>
          </div>
        </section>

        <div className="divider" />

        {/* ── QUIÉNES SOMOS ─────────────────────────────────────────── */}
        <section id="nosotros" style={{ padding: "88px 24px", background: "var(--navy-mid)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            {/* Texto */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 16 }}>
                Quiénes somos
              </p>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 24 }}>
                Una institución con vocación educativa
              </h2>
              <p style={{ color: "var(--text-dim)", fontSize: 16, lineHeight: 1.8, marginBottom: 20 }}>
                La I.E.P. Cristo Reina es una institución educativa particular ubicada en Ate-Vitarte, Lima,
                comprometida con la formación integral de niños y jóvenes desde el nivel inicial hasta secundaria.
              </p>
              <p style={{ color: "var(--text-dim)", fontSize: 16, lineHeight: 1.8 }}>
                Brindamos una educación de calidad que combina la excelencia académica con la formación en valores,
                acompañando a cada estudiante en su desarrollo personal y social.
              </p>
            </div>

            {/* Stats / datos rápidos */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { num: "3", label: "Niveles educativos", sub: "Inicial, Primaria y Secundaria" },
                { num: "UGEL", label: "N.° 06", sub: "Ate-Vitarte, Lima" },
                { num: "+", label: "Años de trayectoria", sub: "Formando generaciones" },
                { num: "100%", label: "Compromiso", sub: "Con cada estudiante" },
              ].map((item) => (
                <div key={item.label} className="card">
                  <div style={{ fontSize: 28, fontWeight: 900, color: "var(--gold)", lineHeight: 1, marginBottom: 6 }}>{item.num}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ color: "var(--text-faint)", fontSize: 12, lineHeight: 1.5 }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ── MISIÓN Y VISIÓN ───────────────────────────────────────── */}
        <section id="mision" style={{ padding: "88px 24px", background: "var(--navy)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 14 }}>
                Identidad institucional
              </p>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Misión y Visión
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Misión */}
              <div className="card" style={{ borderTop: "3px solid var(--gold)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 18 }}>
                  Misión
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.3, marginBottom: 16 }}>
                  Formar personas íntegras para la sociedad
                </h3>
                <p style={{ color: "var(--text-dim)", fontSize: 15, lineHeight: 1.8 }}>
                  Brindar una educación de calidad basada en valores cristianos, excelencia académica y formación
                  humana, desarrollando en cada estudiante las competencias necesarias para enfrentar los retos del
                  mundo moderno con ética y responsabilidad.
                </p>
              </div>

              {/* Visión */}
              <div className="card" style={{ borderTop: "3px solid #47B5E8" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "#47B5E8", textTransform: "uppercase", marginBottom: 18 }}>
                  Visión
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 20, lineHeight: 1.3, marginBottom: 16 }}>
                  Ser referente educativo en Ate-Vitarte
                </h3>
                <p style={{ color: "var(--text-dim)", fontSize: 15, lineHeight: 1.8 }}>
                  Ser reconocida como una institución educativa líder en el distrito de Ate-Vitarte, destacada por
                  la calidad de su enseñanza, la solidez de sus valores y el impacto positivo de sus egresados
                  en la familia, la comunidad y el país.
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ── NIVELES EDUCATIVOS ────────────────────────────────────── */}
        <section id="niveles" style={{ padding: "88px 24px", background: "var(--navy-mid)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 14 }}>
                Oferta educativa
              </p>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Niveles que ofrecemos
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {[
                {
                  nivel: "Inicial",
                  rango: "3 a 5 años",
                  desc: "Estimulamos el desarrollo integral del niño mediante el juego, la creatividad y el afecto, sentando las bases para su aprendizaje futuro.",
                  color: "#F0C800",
                },
                {
                  nivel: "Primaria",
                  rango: "1.° a 6.° grado",
                  desc: "Fortalecemos las habilidades lectoras, matemáticas y científicas con metodologías activas que motivan el aprendizaje significativo.",
                  color: "#1A33CC",
                },
                {
                  nivel: "Secundaria",
                  rango: "1.° a 5.° año",
                  desc: "Preparamos a los jóvenes para la educación superior y la vida, con una formación académica sólida y orientación vocacional.",
                  color: "#47B5E8",
                },
              ].map((n) => (
                <div key={n.nivel} className="nivel-card">
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%", margin: "0 auto 20px",
                    background: `rgba(${n.color === "#F0C800" ? "240,200,0" : n.color === "#1A33CC" ? "26,51,204" : "71,181,232"},0.15)`,
                    border: `2px solid ${n.color}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", background: n.color }} />
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 6 }}>{n.nivel}</div>
                  <div style={{ fontSize: 13, color: n.color, fontWeight: 600, marginBottom: 16, letterSpacing: "0.05em" }}>{n.rango}</div>
                  <p style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: 1.7 }}>{n.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ── CONTACTO ──────────────────────────────────────────────── */}
        <section id="contacto" style={{ padding: "88px 24px", background: "var(--navy)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
            {/* Texto izquierdo */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", color: "var(--gold)", textTransform: "uppercase", marginBottom: 16 }}>
                Contáctanos
              </p>
              <h2 style={{ fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 24 }}>
                Estamos para atenderte
              </h2>
              <p style={{ color: "var(--text-dim)", fontSize: 16, lineHeight: 1.8, marginBottom: 36 }}>
                Si deseas información sobre matrículas, vacantes, pensiones u otros servicios, comunícate con
                nosotros. El personal de admisión estará encantado de orientarte.
              </p>
              <a href="#contacto" className="btn-primary" style={{ fontSize: 14 }}>
                Solicitar información
              </a>
            </div>

            {/* Datos de contacto */}
            <div>
              {[
                {
                  icon: "📍",
                  label: "Dirección",
                  value: "Ate-Vitarte, Lima",
                  sub: "Lima, Perú",
                },
                {
                  icon: "📞",
                  label: "Teléfono",
                  value: "(01) 000-0000",
                  sub: "Lunes a viernes, 8:00 a.m. – 5:00 p.m.",
                },
                {
                  icon: "✉️",
                  label: "Correo electrónico",
                  value: "informes@cristoreina.edu.pe",
                  sub: "Te respondemos en menos de 24 horas",
                },
                {
                  icon: "🏫",
                  label: "Dependencia",
                  value: "UGEL N.° 06",
                  sub: "Ate-Vitarte",
                },
              ].map((c) => (
                <div key={c.label} className="contact-item">
                  <div className="contact-icon">{c.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-faint)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{c.value}</div>
                    <div style={{ color: "var(--text-faint)", fontSize: 13 }}>{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        <footer style={{ padding: "36px 24px", background: "rgba(0,0,0,0.3)" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative", width: 26, height: 32, flexShrink: 0 }}>
                <Image src="/logo-cr.svg" alt="Logo" fill style={{ objectFit: "contain" }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>I.E.P. Cristo Reina</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)" }}>UGEL N.° 06 — Ate-Vitarte, Lima</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "var(--text-faint)" }}>© 2026 I.E.P. Cristo Reina</span>
              <Link href="/login" style={{ fontSize: 12, color: "var(--text-faint)", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 1, transition: "color .2s" }}>
                Acceso para personal
              </Link>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
