import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import DirectorDashboard from "@/components/dashboards/DirectorDashboard"
import DocenteDashboard from "@/components/dashboards/DocenteDashboard"
import PadreDashboard from "@/components/dashboards/PadreDashboard"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const role = session?.user?.role ?? "docente"

  if (role === "director" || role === "admin" || role === "coordinador") {
    return <DirectorDashboard session={session} />
  }
  if (role === "padre") {
    return <PadreDashboard session={session} />
  }
  if (role === "psicologo") {
    const { redirect } = await import("next/navigation")
    redirect("/dashboard/psicologia")
  }
  return <DocenteDashboard session={session} />
}
