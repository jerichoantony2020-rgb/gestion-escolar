import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    if (pathname.startsWith("/superadmin") && token?.role !== "superadmin") {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const pathname = req.nextUrl.pathname
        // Allow static assets (images, fonts, styles served from public/)
        if (/\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf|css|js)$/i.test(pathname)) return true
        // Allow public pages
        const pub = ["/", "/inicio", "/nosotros", "/noticias", "/contacto", "/login"]
        if (pub.some((p) => pathname === p || pathname.startsWith("/api/auth"))) return true
        // Allow portal code-based API routes (no NextAuth needed)
        if (
          pathname.startsWith("/api/portal/acceso") ||
          pathname.startsWith("/api/portal/data") ||
          pathname.startsWith("/api/portal/logout")
        ) return true
        return !!token
      },
    },
  }
)

export const config = {
  // Only protect dashboard, superadmin, and non-auth API routes.
  // Public pages, static files, and /public/ assets are NOT listed here
  // so the middleware never intercepts them.
  matcher: [
    "/dashboard/:path*",
    "/superadmin/:path*",
    "/api/((?!auth).+)",
  ],
}
