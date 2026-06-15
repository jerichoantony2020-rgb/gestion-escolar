export default function ShieldHero() {
  return (
    <div
      className="shield-float"
      style={{
        width: 180,
        height: 220,
        marginBottom: 36,
        filter: "drop-shadow(0 8px 32px rgba(240,200,0,0.2))",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-cr.png"
        alt="Escudo I.E.P. Cristo Reina"
        width={180}
        height={220}
        style={{ objectFit: "contain", width: "100%", height: "100%" }}
      />
    </div>
  )
}
