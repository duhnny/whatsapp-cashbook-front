import { useEffect, useState } from 'react'

import type { Category } from './categories'

export type ColorScheme = 'light' | 'dark'

// Categorical slots in the documented fixed order, one hue per category
// identity. The 9th enum value ("others") wears the muted fold tone instead of
// a generated hue. Dark steps are the same hues re-stepped for the dark card.
const LIGHT_COLORS: Record<Category, string> = {
  payment: '#2a78d6',
  transportation: '#eb6834',
  food_and_beverage: '#1baf7a',
  groceries: '#eda100',
  bills: '#e87ba4',
  subscriptions: '#008300',
  health: '#6250d6',
  appearance: '#e34948',
  others: '#898781',
}

const DARK_COLORS: Record<Category, string> = {
  payment: '#3987e5',
  transportation: '#d95926',
  food_and_beverage: '#199e70',
  groceries: '#c98500',
  bills: '#d55181',
  subscriptions: '#008300',
  health: '#9085e9',
  appearance: '#e66767',
  others: '#898781',
}

// Chart chrome, in the reference palette's tokens.
export const CHROME = {
  light: {
    surface: '#ffffff',
    grid: '#e1e0d9',
    axis: '#898781',
    ink: '#171717',
    subInk: '#52514e',
    insideFill: '#ffffff',
    insideFillOnYellow: '#0b0b0b',
    cursor: 'rgba(11, 11, 11, 0.05)',
  },
  dark: {
    surface: '#171717',
    grid: '#2c2c2a',
    axis: '#898781',
    ink: '#f0efec',
    subInk: '#c3c2b7',
    insideFill: '#ffffff',
    insideFillOnYellow: '#0b0b0b',
    cursor: 'rgba(255, 255, 255, 0.07)',
  },
} as const

export function useColorScheme(): ColorScheme {
  const [scheme, setScheme] = useState<ColorScheme>(() =>
    typeof window === 'undefined' || !window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'light'
      : 'dark',
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setScheme(query.matches ? 'dark' : 'light')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return scheme
}

export function useChartTheme() {
  const scheme = useColorScheme()

  return {
    scheme,
    colors: scheme === 'dark' ? DARK_COLORS : LIGHT_COLORS,
    chrome: scheme === 'dark' ? CHROME.dark : CHROME.light,
  }
}
