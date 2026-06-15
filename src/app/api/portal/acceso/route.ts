import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, resetRateLimit } from "@/lib/portalRateLimit"

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown"
  const { allowed, waitMs } = checkRateLimit(ip)
  if (!allowed) {
    const mins = Math.ceil((waitMs ?? 0) / 60000)
    return NextResponse.json({ error: `Demasiados intentos. Intenta en ${mins} minutos.` }, { status: 429 })
  }

  let code: string
  try {
    const body = await req.json()
    code = String(body.code ?? "").trim().toUpperCase()
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  if (!code) return NextResponse.json({ error: "Ingresa tu código de acceso" }, { status: 400 })

  const parent = await prisma.studentParent.findUnique({
    where: { portalCode: code },
    select: { id: true, name: true },
  })

  if (!parent) {
    return NextResponse.json({ error: "Código incorrecto. Verifica e intenta de nuevo." }, { status: 401 })
  }

  resetRateLimit(ip)

  const res = NextResponse.json({ ok: true, name: parent.name })
  res.cookies.set("cr_portal", code, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  })
  return res
}
