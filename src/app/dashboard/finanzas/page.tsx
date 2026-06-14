import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import FinanzasClient from "./FinanzasClient"

export default async function FinanzasPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.canViewPayments) redirect("/dashboard")

  return <FinanzasClient />
}
