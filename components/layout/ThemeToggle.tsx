'use client'

import { Moon, SunMedium } from 'lucide-react'
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  localStorage.setItem('voluforge-theme', theme)
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = localStorage.getItem('voluforge-theme')
    const initial = stored === 'dark' ? 'dark' : 'light'
    setTheme(initial)
    applyTheme(initial)
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
    </button>
  )
}
