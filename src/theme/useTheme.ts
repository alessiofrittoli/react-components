'use client'

import { ThemeContext, type ThemeCtx } from './ThemeContext'
import { useContext } from 'react'

export const useTheme = (): ThemeCtx => {
	const context = useContext(ThemeContext)

	if (!context) {
		throw new Error(
			'useTheme has been called outside the ThemeProvider Component. Please make sure to wrap your application with the ThemeProvider Component.',
		)
	}

	return context
}
