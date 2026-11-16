const PHONE_KEY = 'whatsapp-cashbook:onboarding:phone'
const VERIFIED_KEY = 'whatsapp-cashbook:onboarding:verified'

export const getStoredPhone = (): string | null => sessionStorage.getItem(PHONE_KEY)

export const storePhone = (phone: string): void => {
  sessionStorage.setItem(PHONE_KEY, phone)
}

export const clearStoredPhone = (): void => {
  sessionStorage.removeItem(PHONE_KEY)
}

export const isVerified = (): boolean => sessionStorage.getItem(VERIFIED_KEY) === '1'

export const setVerified = (): void => {
  sessionStorage.setItem(VERIFIED_KEY, '1')
}

export const clearOnboarding = (): void => {
  sessionStorage.removeItem(PHONE_KEY)
  sessionStorage.removeItem(VERIFIED_KEY)
}
