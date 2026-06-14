import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        let user
        try {
          user = await prisma.user.findFirst({
            where: { email: credentials.email, active: true },
            include: { roles: { include: { role: true } } },
          })
        } catch (err) {
          console.error("[auth] prisma.user.findFirst error:", err)
          return null
        }

        if (!user || !user.passwordHash) return null

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null

        const primaryRole = user.roles[0]?.role?.name ?? "docente"

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          institutionId: user.institutionId,
          role: primaryRole,
          canViewPayments: user.canViewPayments,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.institutionId = user.institutionId
        token.role = user.role
        token.canViewPayments = user.canViewPayments
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.institutionId = token.institutionId
        session.user.role = token.role
        session.user.canViewPayments = token.canViewPayments
      }
      return session
    },
  },
}

// Superadmin auth (separate from institution users)
export async function authorizeSuperadmin(email: string, password: string) {
  const sa = await prisma.superadmin.findUnique({ where: { email } })
  if (!sa) return null
  const valid = await bcrypt.compare(password, sa.passwordHash)
  return valid ? sa : null
}
