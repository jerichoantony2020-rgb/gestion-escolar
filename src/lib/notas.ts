// Conversión oficial nota numérica (0-20) → nivel de logro MINEDU (AD/A/B/C),
// usada para que el Informe de Progreso muestre siempre la escala literal
// aunque el docente registre las evaluaciones de forma numérica.
export function scoreToLevel(avg: number): string {
  if (avg >= 18) return "AD"
  if (avg >= 14) return "A"
  if (avg >= 11) return "B"
  return "C"
}

export function avgScores(scores: (number | string)[]): number | null {
  const nums = scores.map(v => parseFloat(String(v))).filter(n => !isNaN(n))
  if (!nums.length) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
}
