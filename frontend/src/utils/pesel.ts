export const isValidPesel = (pesel: string): boolean => {
  const s = pesel.trim()
  if (s.length !== 11) return false

  for (let i = 0; i < 11; i += 1) {
    if (s[i] < '0' || s[i] > '9') return false
  }
  return true
}
