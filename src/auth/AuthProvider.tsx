'use client'

import type { SignInHandler, SessionResponse, SignOutHandler } from './AuthContext'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthContext } from './AuthContext'

const loggerChild = { module: 'AuthProvider' }

const logger = {
	...console,
	log: (...args: Parameters<typeof console.log>) => console.log(loggerChild, ...args),
	info: (...args: Parameters<typeof console.info>) => console.info(loggerChild, ...args),
	warn: (...args: Parameters<typeof console.warn>) => console.warn(loggerChild, ...args),
	error: (...args: Parameters<typeof console.error>) => console.error(loggerChild, ...args),
}

export type AnonymousSignInHandler<T = unknown> = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	...args: any[]
) => SessionResponse<T> | Promise<SessionResponse<T>>

export type GetSessionHandler<T = unknown> = () => SessionResponse<T> | Promise<SessionResponse<T>>
export type RefreshAccessTokenHandler<T = unknown> = () => SessionResponse<T> | Promise<SessionResponse<T>>

export interface AuthProviderProps<T = unknown> {
	/**
	 * Enable debug logs.
	 *
	 * @default false
	 */
	debug?: boolean
	/**
	 * Defines maximum access token refresh retries before clearing auth session.
	 *
	 * @default 0
	 */
	refreshRetries?: number
	/**
	 * A custom callback which resolves session data.
	 *
	 */
	signIn: AnonymousSignInHandler<T>
	/**
	 * A custom callback to sign-out.
	 *
	 */
	signOut: SignOutHandler
	/**
	 * A custom callback which resolves session data run on page load.
	 *
	 */
	getSession: GetSessionHandler<T>
	/**
	 * A custom callback which resolves session data run on page load.
	 *
	 */
	refreshAccessToken: RefreshAccessTokenHandler<T>
}

export const AuthProvider: React.FC<React.PropsWithChildren<AuthProviderProps>> = ({
	debug = false,
	refreshRetries = 0,
	signIn: signInHandler,
	signOut: signOutHandler,
	getSession: getSessionHandler,
	refreshAccessToken: refreshAccessTokenHandler,
	children,
}) => {
	const [isLoading, setIsLoading] = useState(true)
	const [session, setSession] = useState<SessionResponse | undefined>()

	const timeoutId = useRef<NodeJS.Timeout | undefined>(undefined)
	const intervalId = useRef<NodeJS.Timeout | undefined>(undefined)
	const refreshRetriesCount = useRef<number>(0)

	/**
	 * Sign out.
	 *
	 */
	const signOut = useCallback(async () => {
		setSession(undefined)
		await signOutHandler()
	}, [setSession, signOutHandler])

	/**
	 * Refresh access token.
	 *
	 */
	const refreshAccessToken = useCallback<RefreshAccessTokenHandler>(async () => {
		const result = await refreshAccessTokenHandler()

		setSession(result)

		if (debug) {
			logger.log(
				{ timeoutId: timeoutId.current, intervalId: intervalId.current },
				'Access token refreshed.',
			)
		}

		return result
	}, [debug, setSession, refreshAccessTokenHandler])

	/**
	 * Start refresh interval.
	 *
	 */
	const startRefreshInterval = useCallback(
		(expDate: Date) => {
			const expiresMs = expDate.getTime() - Date.now()

			clearInterval(intervalId.current)

			intervalId.current = setInterval(async () => {
				try {
					await refreshAccessToken()
					refreshRetriesCount.current = 0
				} catch (error) {
					refreshRetriesCount.current = refreshRetriesCount.current + 1

					if (refreshRetriesCount.current >= refreshRetries) {
						clearInterval(intervalId.current)
						logger.warn({ intervalId: intervalId.current }, 'Max refresh retries reached.')
						intervalId.current = undefined
						await signOut()
					}

					throw error
				}
			}, expiresMs)

			if (debug) {
				logger.log(
					{ nextRefresh: expDate, intervalId: intervalId.current },
					'Started refresh access token interval.',
				)
			}
		},
		[debug, refreshRetries, refreshAccessToken, signOut],
	)

	/**
	 * Sign in and start refresh interval.
	 *
	 */
	const signIn = useCallback<SignInHandler>(
		async (...args) => {
			const result = await signInHandler(...args)

			setSession(result)

			const { accessJwtExp } = result

			if (accessJwtExp) {
				await startRefreshInterval(new Date(accessJwtExp))
			}

			return result
		},
		[signInHandler, setSession, startRefreshInterval],
	)

	/**
	 * Fetch session and start refresh interval when access token expires.
	 *
	 */
	const getSession = useCallback(async () => {
		clearTimeout(timeoutId.current)

		const result = await getSessionHandler()

		setSession(result)

		const { accessJwtExp } = result

		if (accessJwtExp) {
			const expDate = new Date(accessJwtExp)
			const expiresMs = expDate.getTime() - Date.now()

			timeoutId.current = setTimeout(async () => {
				timeoutId.current = undefined

				const { accessJwtExp } = await refreshAccessToken()

				if (accessJwtExp) {
					startRefreshInterval(new Date(accessJwtExp))
				}
			}, expiresMs)

			if (debug) {
				logger.log(
					{ nextRefresh: expDate, timeoutId: timeoutId.current },
					'Started refresh access token timeout.',
				)
			}
		}
	}, [debug, getSessionHandler, setSession, refreshAccessToken, startRefreshInterval])

	/**
	 * Get session on page load.
	 *
	 */
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		getSession()
			.then(() => {
				setIsLoading(false)
			})
			.catch(error => logger.error({ error }, 'Initial get session failed.'))

		return () => {
			clearTimeout(timeoutId.current)
			clearInterval(intervalId.current)
		}
	}, [getSession])

	return (
		<AuthContext.Provider value={{ session, isLoading, signIn, signOut }}>
			{children}
		</AuthContext.Provider>
	)
}
