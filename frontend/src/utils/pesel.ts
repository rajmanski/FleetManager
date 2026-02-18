const PESEL_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]

export const isValidPesel = (pesel: string): boolean => {
  const s = pesel.trim()
  if (s.length !== 11) return false

  const digits: number[] = []
  for (let i = 0; i < 11; i += 1) {
    if (s[i] < '0' || s[i] > '9') return false
    digits.push(Number(s[i]))
  }

  let sum = 0
  for (let i = 0; i < 10; i += 1) {
    sum += digits[i] * PESEL_WEIGHTS[i]
  }

  let checksum = 10 - (sum % 10)
  if (checksum === 10) checksum = 0

  return digits[10] === checksum
}
