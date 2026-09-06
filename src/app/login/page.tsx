"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (res?.error) {
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.")
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-8 shadow-sm"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-xl">
            CR
          </div>
          <div className="text-center">
            <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>I.E.P.</p>
            <p className="text-lg font-bold" style={{ color: "var(--fg)" }}>Cristo Reina</p>
          </div>
        </div>

        <h1 className="text-xl font-semibold mb-6 text-center" style={{ color: "var(--fg)" }}>
          Iniciar sesión
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--fg)" }}>
              Correo electrónico
            </label>
            <input
              type="email" autoComplete="email" inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@cristoreina.edu.pe"
              className="w-full px-3 rounded-lg border outline-none focus:ring-2 focus:ring-primary-500 transition"
              
              style={{
                background: "var(--bg)",
                borderColor: "var(--border)",
                color: "var(--fg)",
                minHeight: 52,
                fontSize: 16,
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--fg)" }}>
              Contraseña
            </label>
            <input
              type="password" autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 rounded-lg border outline-none focus:ring-2 focus:ring-primary-500 transition"
              
              style={{
                background: "var(--bg)",
                borderColor: "var(--border)",
                color: "var(--fg)",
                minHeight: 52,
                fontSize: 16,
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg font-semibold bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-60 transition-colors"
            style={{ minHeight: 52, fontSize: 15 }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: "var(--muted)" }}>
          ¿Olvidaste tu contraseña? Contacta al administrador.
        </p>
      </div>

      <Link href="/inicio" className="mt-4 text-xs hover:underline inline-flex items-center" style={{ color: "var(--muted)", minHeight: 44, paddingInline: 12 }}>
        ← Volver al inicio
      </Link>
    </main>
  )
}
