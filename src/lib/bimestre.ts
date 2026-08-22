// Periodo escolar peruano (marzo-diciembre) dividido en 4 bimestres.
export function bimestreRanges(year: number) {
  return [
    { label: "I Bimestre", start: new Date(year, 2, 1), end: new Date(year, 4, 31) },   // mar-may
    { label: "II Bimestre", start: new Date(year, 5, 1), end: new Date(year, 6, 31) },  // jun-jul
    { label: "III Bimestre", start: new Date(year, 7, 1), end: new Date(year, 8, 30) }, // ago-sep
    { label: "IV Bimestre", start: new Date(year, 9, 1), end: new Date(year, 11, 31) }, // oct-dic
  ]
}

export function currentBimestre(date = new Date()) {
  const ranges = bimestreRanges(date.getFullYear())
  return ranges.find(r => date >= r.start && date <= r.end) ?? ranges[0]
}
