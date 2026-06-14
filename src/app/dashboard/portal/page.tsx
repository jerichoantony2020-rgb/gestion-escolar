import PortalClient from "./PortalClient"

export default function PortalPage() {
  return (
    <div>
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>Portal Familiar</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Notas, conducta, asistencia y pagos de tu hijo(a)</p>
      </div>
      <PortalClient />
    </div>
  )
}
