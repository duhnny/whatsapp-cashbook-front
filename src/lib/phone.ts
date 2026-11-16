const MIN_PHONE_DIGITS = 10
const MAX_PHONE_DIGITS = 15

/** Keeps only the digits of a phone number, dropping spaces, dashes and the leading "+". */
export const sanitizePhoneInput = (input: string): string => input.replace(/\D/g, '')

/** E.164-ish guard: 10 to 15 digits, country code included. */
export const isValidPhone = (digits: string): boolean =>
  digits.length >= MIN_PHONE_DIGITS && digits.length <= MAX_PHONE_DIGITS
