"use client"

import Image from "next/image"

export default function ShieldHero() {
  return (
    <div
      className="shield-float"
      style={{
        position: "relative",
        width: 180,
        height: 220,
        marginBottom: 36,
        filter: "drop-shadow(0 8px 32px rgba(240,200,0,0.2))",
      }}
    >
      <Image
        src="/logo-cr.png"
        alt="Escudo I.E.P. Cristo Reina"
        fill
        priority
        sizes="180px"
        style={{ objectFit: "contain" }}
        onError={e => { (e.target as HTMLImageElement).src = "/logo-cr.svg" }}
      />
    </div>
  )
}
