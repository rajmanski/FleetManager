export const isValidVin = (vin: string): boolean => {
  const normalized = vin.trim().toUpperCase()
  if (normalized.length !== 17) return false

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i]
    if (char === 'I' || char === 'O' || char === 'Q') return false
    const isDigit = char >= '0' && char <= '9'
    const isLetter = char >= 'A' && char <= 'Z'
    if (!isDigit && !isLetter) return false
  }
  return true
}
