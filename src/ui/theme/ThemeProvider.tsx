import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ThemeContextValue {
  theme: 'dark' | 'light'
  toggle: () => void
  setTheme: (t: 'dark' | 'light') => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'))

  const apply = (t: 'dark' | 'light') => {
    document.documentElement.dataset.theme = t
    setThemeState(t)
  }

  const setTheme = (t: 'dark' | 'light') => apply(t)
  const toggle = () => apply(theme === 'dark' ? 'light' : 'dark')

  useEffect(() => { apply(theme) }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
