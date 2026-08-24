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
