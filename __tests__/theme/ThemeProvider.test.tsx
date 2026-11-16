'use client'

import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { useTheme } from '@/theme/useTheme'
import { useEffect } from 'react'

vi.mock('@alessiofrittoli/react-hooks', async () => {
	const { useCallback, useEffect, useState } = await import('react')

	return {
		useDarkMode: (options: { docClassNames: string[] }) => {
			const [isDarkMode, setIsDarkMode] = useState(false)
			const [isDarkOS] = useState(false)
			const [darkClass, lightClass] = options.docClassNames

			useEffect(() => {
				document.documentElement.classList.toggle(darkClass, isDarkMode)
				document.documentElement.classList.toggle(lightClass, !isDarkMode)
			}, [darkClass, isDarkMode, lightClass])

			return {
				isDarkMode,
				isDarkOS,
				toggleDarkMode: useCallback(() => setIsDarkMode(value => !value), []),
				enableDarkMode: useCallback(() => setIsDarkMode(true), []),
				disableDarkMode: useCallback(() => setIsDarkMode(false), []),
			}
		},
	}
})

const ThemeStatus: React.FC = () => {
	const { isDarkMode, isDarkOS, toggleDarkMode, enableDarkMode, disableDarkMode } = useTheme()

	useEffect(() => {
		Object.assign(window, { themeActions: { toggleDarkMode, enableDarkMode, disableDarkMode } })
	}, [toggleDarkMode, enableDarkMode, disableDarkMode])

	return <output data-testid='theme-status'>{`${isDarkMode}:${isDarkOS}`}</output>
}

afterEach(() => {
	document.documentElement.classList.remove('dark', 'light')
	Reflect.deleteProperty(window, 'themeActions')
})

describe('ThemeProvider', () => {
	it('renders children and exposes the theme state and actions', () => {
		render(
			<ThemeProvider>
				<p>Application content</p>
				<ThemeStatus />
			</ThemeProvider>,
		)

		expect(screen.getByText('Application content')).toBeInTheDocument()
		expect(screen.getByTestId('theme-status')).toHaveTextContent('false:false')
		expect(document.documentElement).toHaveClass('light')
	})

	it('updates the document class and state through the exposed actions', () => {
		render(
			<ThemeProvider>
				<ThemeStatus />
			</ThemeProvider>,
		)

		const actions = (
			window as typeof window & {
				themeActions: {
					toggleDarkMode: () => void
					enableDarkMode: () => void
					disableDarkMode: () => void
				}
			}
		).themeActions

		act(() => actions.enableDarkMode())
		expect(screen.getByTestId('theme-status')).toHaveTextContent('true:false')
		expect(document.documentElement).toHaveClass('dark')

		act(() => actions.toggleDarkMode())
		expect(screen.getByTestId('theme-status')).toHaveTextContent('false:false')
		expect(document.documentElement).toHaveClass('light')

		act(() => actions.disableDarkMode())
		expect(screen.getByTestId('theme-status')).toHaveTextContent('false:false')
	})
})

describe('useTheme', () => {
	it('throws an error if called outside the `ThemeProvider` Component', () => {
		expect(() => render(<ThemeStatus />)).toThrow(
			'useTheme has been called outside the ThemeProvider Component. Please make sure to wrap your application with the ThemeProvider Component.',
		)
	})
})
