"use client"

import { useRouter } from "next/navigation"

export default function BackButton({ href, label = "Volver" }: { href?: string; label?: string }) {
  const router = useRouter()
  return (
    <button
      onClick={() => (href ? router.push(href) : router.back())}
      className="inline-flex items-center gap-1.5 mb-4 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-primary-50 hover:text-primary-600 hover:border-primary-300"
      style={{ borderColor: "var(--border)", color: "var(--muted)" }}
    >
      <span className="text-base leading-none">←</span> {label}
    </button>
  )
}
