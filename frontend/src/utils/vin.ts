const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

const transliterateVinChar = (char: string): number | null => {
  switch (char) {
    case 'A':
    case 'J':
      return 1
    case 'B':
    case 'K':
    case 'S':
      return 2
    case 'C':
    case 'L':
    case 'T':
      return 3
    case 'D':
    case 'M':
    case 'U':
      return 4
    case 'E':
    case 'N':
    case 'V':
      return 5
    case 'F':
    case 'W':
      return 6
    case 'G':
    case 'P':
    case 'X':
      return 7
    case 'H':
    case 'Y':
      return 8
    case 'R':
    case 'Z':
      return 9
    case 'I':
    case 'O':
    case 'Q':
      return null
    default:
      if (char >= '0' && char <= '9') return Number(char)
      return null
  }
}

export const isValidVin = (vin: string): boolean => {
  const normalized = vin.trim().toUpperCase()
  if (normalized.length !== 17) return false

  let sum = 0
  for (let i = 0; i < normalized.length; i += 1) {
    const value = transliterateVinChar(normalized[i])
    if (value === null) return false
    sum += value * VIN_WEIGHTS[i]
  }

  const remainder = sum % 11
  const checkDigit = normalized[8]
  if (remainder === 10) return checkDigit === 'X'
  return checkDigit === String(remainder)
}
