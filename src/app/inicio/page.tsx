import Link from "next/link"
import { prisma } from "@/lib/prisma"
import ShieldHero from "./ShieldHero"

const CATS: Record<string, { label: string; color: string; bg: string }> = {
  academica: { label: "Académica", color: "#1A33CC", bg: "rgba(26,51,204,0.15)" },
  deportiva:  { label: "Deportiva",  color: "#15803D", bg: "rgba(22,163,74,0.18)"  },
  cultural:   { label: "Cultural",   color: "#9333EA", bg: "rgba(147,51,234,0.15)" },
  religiosa:  { label: "Religiosa",  color: "#8A6A00", bg: "rgba(240,200,0,0.20)"  },
}

export const revalidate = 60 // refresca cada 60 s sin rebuild

export default async function InicioPage() {
  let noticias: { id: string; title: string; content: string; imageUrl: string | null; createdAt: Date }[] = []
  let actividades: { id: string; title: string; description: string | null; imageUrl: string | null; category: string; date: Date | null }[] = []

  try {
    const inst = await prisma.institution.findUnique({ where: { slug: "cristo-reina" } })
    if (inst) {
      ;[noticias, actividades] = await Promise.all([
        prisma.noticia.findMany({
          where: { institutionId: inst.id, published: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
        prisma.actividad.findMany({
          where: { institutionId: inst.id, published: true },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
      ])
    }
  } catch {
    // DB no disponible en entorno local — la página igual renderiza con secciones vacías
  }

  return (
    <>
      <style>{`
        /* Página clara con los colores del escudo: papel blanco, tinta azul
           marino, oro como acento. El oro puro (#F0C800) solo sirve de relleno
           o grafismo — sobre blanco no alcanza contraste como texto, así que
           el texto dorado usa una versión tostada. */
        :root {
          --navy:      #0D1E3A;
          --navy-mid:  #112448;
          --gold:      #F0C800;
          --gold-ink:  #8A6A00;
          --gold-dim:  rgba(240,200,0,0.14);
          --gold-line: rgba(196,158,0,0.38);
          --paper:     #FFFFFF;
          --paper-2:   #FBFAF5;
          --white:     #FFFFFF;
          --dim:       rgba(13,30,58,0.68);
          --faint:     rgba(13,30,58,0.66);
          --iborder:   rgba(13,30,58,0.10);
        }
        .inicio-card { background:var(--paper); border:1px solid var(--iborder); border-radius:16px; padding:28px; transition:background .25s,border-color .25s; }
        .inicio-card:hover { background:var(--paper-2); border-color:var(--gold-line); }
        .news-card { background:var(--paper); border:1px solid var(--iborder); border-radius:14px; overflow:hidden; transition:background .25s,border-color .25s,transform .2s; display:flex; flex-direction:column; }
        .news-card:hover { background:var(--paper-2); border-color:var(--gold-line); transform:translateY(-3px); }
        .act-card { background:var(--paper); border:1px solid var(--iborder); border-radius:14px; overflow:hidden; transition:background .25s,border-color .25s,transform .2s; }
        .act-card:hover { background:var(--paper-2); border-color:rgba(13,30,58,0.22); transform:translateY(-3px); }
        .btn-gold { display:inline-block; padding:14px 36px; border-radius:10px; background:var(--gold); color:var(--navy); font-weight:800; font-size:15px; text-decoration:none; transition:opacity .2s,transform .15s; }
        .btn-gold:hover { opacity:.9; transform:translateY(-2px); }
        .contact-row { display:flex; align-items:flex-start; gap:16px; padding:20px 0; border-bottom:1px solid var(--iborder); }
        .contact-row:last-child { border-bottom:none; }
        .ci { width:44px; height:44px; border-radius:10px; background:var(--gold-dim); border:1px solid var(--gold-line); display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:20px; }
        .section-label { font-size:10px; font-weight:700; letter-spacing:.25em; color:var(--gold-ink); text-transform:uppercase; margin-bottom:14px; }
        .divider { height:1px; background:linear-gradient(90deg,transparent,rgba(240,200,0,0.55),rgba(13,30,58,0.18),transparent); }
        .empty-state { border:1px dashed rgba(13,30,58,0.16); border-radius:14px; padding:48px 24px; text-align:center; color:var(--faint); font-size:14px; }
        .inicio-nav-link { font-size:13px; color:var(--dim); text-decoration:none; padding:6px 12px; border-radius:8px; transition:color .2s; }
        .inicio-nav-link:hover { color:var(--navy); }
        .inicio-section-pad { padding:88px 24px; }
        .hamburger-menu { display:none; }
        @media(max-width:768px) {
          .inicio-grid-2  { grid-template-columns:1fr !important; }
          .inicio-grid-3  { grid-template-columns:1fr !important; }
          .portal-grid    { grid-template-columns:1fr !important; gap:14px !important; }
          .contact-grid   { grid-template-columns:1fr !important; }
          .inicio-nav-links { display:none !important; }
          .inicio-section-pad { padding:56px 20px; }
          .portal-btns    { flex-direction:column; width:100%; }
          .portal-btns a  { text-align:center; }
          .hamburger-menu { display:flex; align-items:center; }
          .stats-inner-grid { grid-template-columns:1fr 1fr !important; gap:12px !important; }
          .footer-inner   { flex-direction:column; align-items:flex-start !important; gap:16px !important; }
          .btn-gold       { padding:12px 24px !important; font-size:14px !important; }
        }
        @media(max-width:480px) {
          .inicio-section-pad { padding:44px 16px; }
          .hero-buttons   { flex-direction:column; align-items:stretch; }
          .hero-buttons a { text-align:center; }
        }
      `}</style>

      <div style={{ background:"var(--paper)", minHeight:"100vh", color:"var(--navy)", fontFamily:"var(--font-geist-sans,system-ui,sans-serif)" }}>

        {/* ── NAV ── */}
        <header style={{ position:"sticky", top:0, zIndex:100, backdropFilter:"blur(20px)", background:"rgba(255,255,255,0.92)", borderBottom:"1px solid var(--iborder)" }}>
          <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:32, height:40, flexShrink:0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-cr.png" alt="Escudo I.E.P. Cristo Reina" width={32} height={40} style={{ objectFit:"contain", width:"100%", height:"100%" }} />
              </div>
              <div>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.22em", color:"var(--gold-ink)", textTransform:"uppercase" }}>I.E.P.</div>
                <div style={{ fontSize:14, fontWeight:800 }}>Cristo Reina</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <nav className="inicio-nav-links" style={{ display:"flex", gap:4, alignItems:"center" }}>
                {(["#nosotros","#noticias","#actividades","#contacto"] as const).map((h, i) => (
                  <a key={h} href={h} className="inicio-nav-link">
                    {["Nosotros","Noticias","Actividades","Contacto"][i]}
                  </a>
                ))}
              </nav>
              <Link href="/portal" style={{ padding:"8px 18px", borderRadius:8, border:"1px solid rgba(13,30,58,0.18)", color:"var(--navy)", fontSize:13, fontWeight:600, textDecoration:"none" }}>
                Portal
              </Link>
              {/* Hamburger — enlaces del menú como dropdown CSS-only */}
              <div className="hamburger-menu" style={{ flexDirection:"column", gap:4, cursor:"pointer", padding:"4px 8px" }}>
                <details style={{ position:"relative" }}>
                  <summary style={{ listStyle:"none", cursor:"pointer", display:"flex", flexDirection:"column", gap:5 }}>
                    <span style={{ display:"block", width:22, height:2, background:"var(--navy)", borderRadius:2 }} />
                    <span style={{ display:"block", width:22, height:2, background:"var(--navy)", borderRadius:2 }} />
                    <span style={{ display:"block", width:22, height:2, background:"var(--navy)", borderRadius:2 }} />
                  </summary>
                  <div style={{ position:"absolute", right:0, top:"calc(100% + 12px)", background:"var(--paper)", border:"1px solid var(--iborder)", borderRadius:12, padding:"8px 0", minWidth:180, zIndex:200, backdropFilter:"blur(20px)" }}>
                    {(["#nosotros","#noticias","#actividades","#contacto"] as const).map((h, i) => (
                      <a key={h} href={h} style={{ display:"block", padding:"12px 20px", color:"var(--dim)", textDecoration:"none", fontSize:14, fontWeight:600 }}>
                        {["Nosotros","Noticias","Actividades","Contacto"][i]}
                      </a>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </div>
        </header>

        {/* ── HERO ── */}
        <section style={{ minHeight:"100dvh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"80px 24px", background:"linear-gradient(180deg,#FFFFFF 0%,#FDFCF6 58%,#FBF6E4 100%)", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"40%", left:"50%", transform:"translate(-50%,-50%)", width:600, height:400, borderRadius:"50%", background:"radial-gradient(ellipse,rgba(240,200,0,0.20) 0%,transparent 68%)", pointerEvents:"none" }} />
          <ShieldHero />
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.28em", color:"var(--gold-ink)", textTransform:"uppercase", marginBottom:14 }}>Institución Educativa Particular</p>
          <h1 style={{ fontSize:"clamp(40px,7vw,76px)", fontWeight:900, letterSpacing:"-0.02em", lineHeight:1.05, marginBottom:20 }}>Cristo Reina</h1>
          <p style={{ fontSize:"clamp(15px,2vw,18px)", color:"var(--dim)", maxWidth:520, lineHeight:1.7, marginBottom:40 }}>
            Formando personas íntegras con valores, conocimiento y vocación de servicio en Ate, Lima.
          </p>
          <div className="hero-buttons" style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
            <a href="#nosotros" className="btn-gold">Conoce el colegio</a>
            <a href="#contacto" style={{ display:"inline-block", padding:"14px 36px", borderRadius:10, border:"1px solid rgba(13,30,58,0.18)", color:"var(--navy)", fontSize:15, fontWeight:600, textDecoration:"none" }}>Contáctanos</a>
          </div>
        </section>

        <div className="divider" />

        {/* ── QUIÉNES SOMOS ── */}
        <section id="nosotros" className="inicio-section-pad" style={{ background:"var(--paper-2)" }}>
          <div className="inicio-grid-2" style={{ maxWidth:1200, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center" }}>
            <div>
              <p className="section-label">Quiénes somos</p>
              <h2 style={{ fontSize:"clamp(28px,3.5vw,42px)", fontWeight:800, letterSpacing:"-0.02em", lineHeight:1.15, marginBottom:24 }}>Una institución con vocación educativa</h2>
              <p style={{ color:"var(--dim)", fontSize:16, lineHeight:1.8, marginBottom:20 }}>
                La I.E.P. Cristo Reina es una institución educativa particular ubicada en Ate, Lima, comprometida con la formación integral de niños y jóvenes desde el nivel inicial hasta secundaria.
              </p>
              <p style={{ color:"var(--dim)", fontSize:16, lineHeight:1.8 }}>
                Brindamos una educación de calidad que combina la excelencia académica con la formación en valores, acompañando a cada estudiante en su desarrollo personal y social.
              </p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {[
                { num:"3",    label:"Niveles educativos",  sub:"Inicial, Primaria y Secundaria" },
                { num:"UGEL", label:"N.° 06",              sub:"Ate, Lima" },
                { num:"+",    label:"Años de trayectoria", sub:"Formando generaciones" },
                { num:"100%", label:"Compromiso",          sub:"Con cada estudiante" },
              ].map(s => (
                <div key={s.label} className="inicio-card">
                  <div style={{ fontSize:26, fontWeight:900, color:"var(--gold-ink)", marginBottom:6 }}>{s.num}</div>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{s.label}</div>
                  <div style={{ color:"var(--faint)", fontSize:12, lineHeight:1.5 }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ── MISIÓN Y VISIÓN ── */}
        <section className="inicio-section-pad" style={{ background:"var(--paper)" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:56 }}>
              <p className="section-label">Identidad institucional</p>
              <h2 style={{ fontSize:"clamp(26px,3.5vw,40px)", fontWeight:800, letterSpacing:"-0.02em" }}>Misión y Visión</h2>
            </div>
            <div className="inicio-grid-2" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
              <div className="inicio-card" style={{ borderTop:"3px solid var(--gold)" }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.22em", color:"var(--gold-ink)", textTransform:"uppercase", marginBottom:18 }}>Misión</div>
                <h3 style={{ fontWeight:800, fontSize:20, lineHeight:1.3, marginBottom:16 }}>Formar personas íntegras para la sociedad</h3>
                <p style={{ color:"var(--dim)", fontSize:15, lineHeight:1.8 }}>Brindar una educación de calidad basada en valores, excelencia académica y formación humana, desarrollando en cada estudiante las competencias necesarias para enfrentar los retos del mundo moderno con ética y responsabilidad.</p>
              </div>
              <div className="inicio-card" style={{ borderTop:"3px solid #47B5E8" }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.22em", color:"#47B5E8", textTransform:"uppercase", marginBottom:18 }}>Visión</div>
                <h3 style={{ fontWeight:800, fontSize:20, lineHeight:1.3, marginBottom:16 }}>Ser referente educativo en Ate, Lima</h3>
                <p style={{ color:"var(--dim)", fontSize:15, lineHeight:1.8 }}>Ser reconocida como una institución educativa líder en el distrito de Ate, destacada por la calidad de su enseñanza, la solidez de sus valores y el impacto positivo de sus egresados en la familia, la comunidad y el país.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ── NOTICIAS ── */}
        <section id="noticias" className="inicio-section-pad" style={{ background:"var(--paper-2)" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:56 }}>
              <p className="section-label">Actualidad</p>
              <h2 style={{ fontSize:"clamp(26px,3.5vw,40px)", fontWeight:800, letterSpacing:"-0.02em" }}>Noticias del colegio</h2>
            </div>
            {noticias.length === 0 ? (
              <div className="empty-state">Próximamente publicaremos las últimas noticias del colegio.</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:24 }}>
                {noticias.map(n => (
                  <div key={n.id} className="news-card">
                    {n.imageUrl
                      ? <img src={n.imageUrl} alt={n.title} loading="lazy" style={{ width:"100%", height:180, objectFit:"cover" }} />
                      : <div style={{ height:8, background:"linear-gradient(90deg,var(--gold),#47B5E8)" }} />
                    }
                    <div style={{ padding:24, flex:1, display:"flex", flexDirection:"column" }}>
                      <p style={{ fontSize:11, color:"var(--faint)", marginBottom:10 }}>
                        {new Date(n.createdAt).toLocaleDateString("es-PE", { day:"2-digit", month:"long", year:"numeric" })}
                      </p>
                      <h3 style={{ fontWeight:700, fontSize:17, lineHeight:1.3, marginBottom:10 }}>{n.title}</h3>
                      <p style={{ color:"var(--dim)", fontSize:14, lineHeight:1.7 }}>{n.content.slice(0, 160)}{n.content.length > 160 ? "…" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="divider" />

        {/* ── ACTIVIDADES ── */}
        <section id="actividades" className="inicio-section-pad" style={{ background:"var(--paper)" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:56 }}>
              <p className="section-label">Vida escolar</p>
              <h2 style={{ fontSize:"clamp(26px,3.5vw,40px)", fontWeight:800, letterSpacing:"-0.02em" }}>Actividades</h2>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", marginBottom:40 }}>
              {Object.entries(CATS).map(([k, c]) => (
                <span key={k} style={{ fontSize:12, fontWeight:700, padding:"6px 16px", borderRadius:999, background:c.bg, color:c.color, border:`1px solid ${c.color}40` }}>{c.label}</span>
              ))}
            </div>
            {actividades.length === 0 ? (
              <div className="empty-state">Próximamente publicaremos nuestras actividades académicas, deportivas, culturales y religiosas.</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
                {actividades.map(a => {
                  const cat = CATS[a.category] ?? CATS.academica
                  return (
                    <div key={a.id} className="act-card">
                      {a.imageUrl
                        ? <img src={a.imageUrl} alt={a.title} loading="lazy" style={{ width:"100%", height:160, objectFit:"cover" }} />
                        : <div style={{ height:6, background:cat.color }} />
                      }
                      <div style={{ padding:20 }}>
                        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:10 }}>
                          <span style={{ fontSize:10, fontWeight:700, padding:"3px 10px", borderRadius:999, background:cat.bg, color:cat.color }}>{cat.label}</span>
                          {a.date && <span style={{ fontSize:11, color:"var(--faint)", marginLeft:"auto" }}>{new Date(a.date).toLocaleDateString("es-PE", { day:"2-digit", month:"short" })}</span>}
                        </div>
                        <h3 style={{ fontWeight:700, fontSize:16, lineHeight:1.3, marginBottom:8 }}>{a.title}</h3>
                        {a.description && <p style={{ color:"var(--dim)", fontSize:13, lineHeight:1.6 }}>{a.description.slice(0,120)}{a.description.length > 120 ? "…" : ""}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <div className="divider" />

        {/* ── NIVELES ── */}
        <section className="inicio-section-pad" style={{ background:"var(--paper-2)" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:56 }}>
              <p className="section-label">Oferta educativa</p>
              <h2 style={{ fontSize:"clamp(26px,3.5vw,40px)", fontWeight:800, letterSpacing:"-0.02em" }}>Niveles que ofrecemos</h2>
            </div>
            <div className="inicio-grid-3" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20 }}>
              {[
                { nivel:"Inicial",    rango:"3 a 5 años",      desc:"Estimulamos el desarrollo integral del niño mediante el juego, la creatividad y el afecto, sentando las bases para su aprendizaje futuro.", color:"var(--gold-ink)" },
                { nivel:"Primaria",   rango:"1.° a 6.° grado", desc:"Fortalecemos las habilidades lectoras, matemáticas y científicas con metodologías activas que motivan el aprendizaje significativo.",      color:"#1A33CC" },
                { nivel:"Secundaria", rango:"1.° a 5.° año",   desc:"Preparamos a los jóvenes para la educación superior y la vida, con una formación académica sólida y orientación vocacional.",              color:"#47B5E8" },
              ].map(n => (
                <div key={n.nivel} className="inicio-card" style={{ textAlign:"center" }}>
                  <div style={{ width:48, height:48, borderRadius:"50%", margin:"0 auto 20px", border:`2px solid ${n.color}`, display:"flex", alignItems:"center", justifyContent:"center", background:`${n.color}18` }}>
                    <div style={{ width:14, height:14, borderRadius:"50%", background:n.color }} />
                  </div>
                  <div style={{ fontWeight:900, fontSize:22, marginBottom:6 }}>{n.nivel}</div>
                  <div style={{ fontSize:13, color:n.color, fontWeight:600, marginBottom:16 }}>{n.rango}</div>
                  <p style={{ color:"var(--dim)", fontSize:14, lineHeight:1.7 }}>{n.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ── CONTACTO ── */}
        <section id="contacto" className="inicio-section-pad" style={{ background:"var(--paper-2)" }}>
          <div className="contact-grid" style={{ maxWidth:1200, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"start" }}>
            <div>
              <p className="section-label">Contáctanos</p>
              <h2 style={{ fontSize:"clamp(26px,3.5vw,42px)", fontWeight:800, letterSpacing:"-0.02em", lineHeight:1.15, marginBottom:24 }}>Estamos para atenderte</h2>
              <p style={{ color:"var(--dim)", fontSize:16, lineHeight:1.8, marginBottom:36 }}>
                ¿Deseas información sobre matrículas, vacantes o pensiones? Comunícate con nosotros. El personal de admisión estará encantado de orientarte.
              </p>
              <a href="tel:+51901634663" className="btn-gold" style={{ fontSize:14 }}>Llamar ahora</a>
            </div>
            <div>
              {[
                { icon:"📍", label:"Dirección",   value:"Av. Central 601, Ate",   sub:"Lima, Perú",                                                                    href: undefined },
                { icon:"📞", label:"Teléfono",    value:"+51 901 634 663",         sub:"Lunes a viernes · 8:00 a.m. – 5:00 p.m.",                                      href:"tel:+51901634663" },
                { icon:"🏫", label:"Dependencia", value:"UGEL N.° 06",             sub:"Ate, Lima",                                                                     href: undefined },
                { icon:"📘", label:"Facebook",    value:"I.E.P. Cristo Reina",     sub:"Ver nuestra página",  href:"https://www.facebook.com/profile.php?id=61556234216960" },
              ].map(c => (
                <div key={c.label} className="contact-row">
                  <div className="ci">{c.icon}</div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, color:"var(--faint)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{c.label}</div>
                    {c.href
                      ? <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" style={{ fontWeight:700, fontSize:16, color:"var(--navy)", textDecoration:"none" }}>{c.value}</a>
                      : <div style={{ fontWeight:700, fontSize:16 }}>{c.value}</div>
                    }
                    <div style={{ color:"var(--faint)", fontSize:13, marginTop:2 }}>{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ── FOOTER ── */}
        <footer style={{ padding:"36px 24px", background:"var(--paper-2)", borderTop:"1px solid var(--iborder)" }}>
          <div className="footer-inner" style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:20 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:26, height:32 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-cr.png" alt="" width={26} height={32} style={{ objectFit:"contain", width:"100%", height:"100%" }} />
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700 }}>I.E.P. Cristo Reina</div>
                <div style={{ fontSize:11, color:"var(--faint)" }}>UGEL N.° 06 · Av. Central 601, Ate · Lima, Perú</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
              <span style={{ fontSize:12, color:"var(--faint)" }}>© 2026 I.E.P. Cristo Reina</span>
              <a href="https://www.facebook.com/profile.php?id=61556234216960" target="_blank" rel="noopener noreferrer" style={{ fontSize:12, color:"var(--faint)", textDecoration:"none" }}>Facebook</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
