import type { UseDarkModeOutput } from '@alessiofrittoli/react-hooks'
import { createContext } from 'react'

export type ThemeCtx = UseDarkModeOutput

export const ThemeContext = createContext<ThemeCtx | undefined>(undefined)

ThemeContext.displayName = 'ThemeContext'
