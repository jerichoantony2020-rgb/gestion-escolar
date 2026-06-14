import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      institutionId: string
      role: string
      canViewPayments: boolean
    } & DefaultSession["user"]
  }

  interface User {
    institutionId: string
    role: string
    canViewPayments: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    institutionId: string
    role: string
    canViewPayments: boolean
  }
}
