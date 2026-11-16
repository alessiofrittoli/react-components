'use client'

import { ThemeContext, type ThemeCtx } from '@/theme/ThemeContext'
import { useDarkMode } from '@alessiofrittoli/react-hooks'
import { useMemo } from 'react'

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
	const { isDarkMode, isDarkOS, toggleDarkMode, enableDarkMode, disableDarkMode } = useDarkMode({
		docClassNames: ['dark', 'light'],
	})

	const themeContext: ThemeCtx = useMemo(
		() => ({
			isDarkMode,
			isDarkOS,
			toggleDarkMode,
			enableDarkMode,
			disableDarkMode,
		}),
		[isDarkMode, isDarkOS, toggleDarkMode, enableDarkMode, disableDarkMode],
	)

	return <ThemeContext.Provider value={themeContext}>{children}</ThemeContext.Provider>
}
