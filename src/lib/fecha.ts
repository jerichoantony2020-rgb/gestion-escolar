/**
 * Fecha del colegio.
 *
 * El servidor corre en UTC y el colegio está en Perú (UTC-5, sin horario de
 * verano). Sin corregir, desde las 7 p.m. hora de Lima el servidor ya cree
 * que es el día siguiente: la asistencia escaneada de noche se guardaba con
 * la fecha de mañana y el domingo por la noche se reportaba como lunes.
 *
 * Los registros de asistencia se guardan como medianoche UTC del día
 * calendario, así que estas funciones devuelven ese mismo instante.
 */
const PERU_OFFSET_MS = 5 * 60 * 60 * 1000

/** Partes del día calendario peruano en curso. */
export function peruHoy(ahora = new Date()) {
  const p = new Date(ahora.getTime() - PERU_OFFSET_MS)
  return { year: p.getUTCFullYear(), month: p.getUTCMonth(), day: p.getUTCDate(), diaSemana: p.getUTCDay() }
}

/** Medianoche UTC del día calendario peruano: la clave con que se guardan los registros. */
export function inicioDelDiaPeru(ahora = new Date()): Date {
  const { year, month, day } = peruHoy(ahora)
  return new Date(Date.UTC(year, month, day))
}

/** Sábado o domingo en Perú. */
export function esFinDeSemanaPeru(ahora = new Date()): boolean {
  const d = peruHoy(ahora).diaSemana
  return d === 0 || d === 6
}

/** Hora y minuto en Perú. Necesario para la tolerancia de ingreso. */
export function horaPeru(ahora = new Date()): { hora: number; minuto: number; minutosDelDia: number } {
  const p = new Date(ahora.getTime() - PERU_OFFSET_MS)
  const hora = p.getUTCHours()
  const minuto = p.getUTCMinutes()
  return { hora, minuto, minutosDelDia: hora * 60 + minuto }
}

/** Horario de ingreso del colegio. */
export const INGRESO_DESDE = 7 * 60 + 20   // 7:20 a.m. — se abre la puerta
export const INGRESO_HASTA = 8 * 60 + 50   // 8:50 a.m. — límite de puntualidad

/**
 * Estado de ingreso según la hora peruana: hasta las 8:50 es puntual, después
 * es tardanza. Llegar temprano no se penaliza.
 */
export function estadoDeIngreso(ahora = new Date()): "present" | "late" {
  return horaPeru(ahora).minutosDelDia > INGRESO_HASTA ? "late" : "present"
}

/** "8:50 a.m." — para mostrar la regla en pantalla sin repetir el número. */
export function limitePuntualidadTexto(): string {
  const h = Math.floor(INGRESO_HASTA / 60), m = INGRESO_HASTA % 60
  return `${h}:${String(m).padStart(2, "0")} a.m.`
}
