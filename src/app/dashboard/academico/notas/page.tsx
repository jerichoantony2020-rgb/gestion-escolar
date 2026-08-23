import { redirect } from "next/navigation"

// Este registro de notas por curso plano quedó reemplazado por el registro
// por competencia (formato MINEDU). Se redirige para que nadie entre por una
// URL o marcador viejo y termine en la pantalla vieja.
export default function NotasRedirectPage() {
  redirect("/dashboard/academico/notas-area")
}
