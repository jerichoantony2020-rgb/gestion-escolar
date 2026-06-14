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
        const pub = ["/", "/nosotros", "/noticias", "/contacto", "/login"]
        const pathname = req.nextUrl.pathname
        if (pub.some((p) => pathname === p || pathname.startsWith("/api/auth"))) return true
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public|images).*)"],
}
