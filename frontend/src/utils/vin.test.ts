import { describe, expect, it } from 'vitest'
import { isValidVin } from './vin'

describe('isValidVin', () => {
  it('accepts 17-character alphanumeric VIN without checksum validation', () => {
    expect(isValidVin('1HGCM82633A004353')).toBe(true)
  })

  it('rejects VIN with invalid length', () => {
    expect(isValidVin('1HGCM82633A00435')).toBe(false)
  })

  it('rejects VIN containing disallowed letters I, O, Q', () => {
    expect(isValidVin('1HGIM82633A004352')).toBe(false)
    expect(isValidVin('1HGOM82633A004352')).toBe(false)
    expect(isValidVin('1HGQM82633A004352')).toBe(false)
  })

  it('rejects VIN containing non-alphanumeric characters', () => {
    expect(isValidVin('1HGCM82633A00-352')).toBe(false)
  })
})
