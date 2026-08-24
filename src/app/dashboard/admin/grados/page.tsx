"use client"

import { useState, useEffect } from "react"

type Section = { id: string; name: string }
type Grade = { id: string; name: string; level: { name: string }; sections: Section[] }

export default function GradosPage() {
  const [grades, setGrades] = useState<Grade[]>([])

  useEffect(() => {
    fetch("/api/grados").then(r => r.json()).then(setGrades)
  }, [])

  const byLevel: Record<string, Grade[]> = {}
  for (const g of grades) {
    const lvl = g.level.name
    if (!byLevel[lvl]) byLevel[lvl] = []
    byLevel[lvl].push(g)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      <div className="space-y-6">
        {Object.entries(byLevel).map(([level, gs]) => (
          <div key={level}>
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted)" }}>{level}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gs.map(g => (
                <div key={g.id} className="rounded-xl border p-4" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <p className="font-semibold text-sm" style={{ color: "var(--fg)" }}>{g.name}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                    Secciones: {g.sections.map(s => `"${s.name}"`).join(", ") || "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
