// Currency is hard-coded to BRL: the amounts come from a Brazilian bank-account
// ledger. Swap the currency code here if that ever changes.

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BRL' })
const signedCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'BRL',
  signDisplay: 'exceptZero',
})
const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const wholeCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})
const date = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })

export const formatCurrency = (value: number) => currency.format(value)
export const formatWholeCurrency = (value: number) => wholeCurrency.format(value)
export const formatSignedCurrency = (value: number) => signedCurrency.format(value)
export const formatCompactCurrency = (value: number) => compactCurrency.format(value)
export const formatDate = (value: string | Date) => date.format(new Date(value))
export const formatMonth = (value: Date) => month.format(value)
export const formatMonthWithYear = (value: Date) =>
  `${month.format(value)} ’${String(value.getUTCFullYear()).slice(2)}`
