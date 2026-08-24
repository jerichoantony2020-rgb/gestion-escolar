import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Dock from "@/components/navigation/Dock"
import PageHeader from "@/components/navigation/PageHeader"
import SessionProvider from "@/components/providers/SessionProvider"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  return (
    <SessionProvider session={session}>
      <div className="dash-bg">
        <div className="print:hidden"><Dock /></div>
        {/* Offset: mobile top bar + bottom dock; desktop top nav */}
        <div className="pt-12 pb-24 md:pt-14 md:pb-0 print:pt-0 print:pb-0">
          <PageHeader />
          {children}
        </div>
      </div>
    </SessionProvider>
  )
}
