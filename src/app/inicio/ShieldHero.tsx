export default function ShieldHero() {
  return (
    <div
      className="shield-hero"
      style={{
        width: 260,
        height: 318,
        maxWidth: "62vw",
        marginBottom: 34,
        // Sombra proyectada real (desplazamiento + desenfoque), no un halo plano.
        filter: "drop-shadow(0 14px 34px rgba(13,30,58,0.22))",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-cr.png"
        alt="Escudo I.E.P. Cristo Reina"
        width={260}
        height={318}
        style={{ objectFit: "contain", width: "100%", height: "100%" }}
      />
    </div>
  )
}
