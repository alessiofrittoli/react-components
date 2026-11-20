'use client'

import type { AnonymousSignInHandler, GetSessionHandler, RefreshAccessTokenHandler } from './types'
import type { SignInHandler, SessionResponse, SignOutHandler } from './AuthContext'
import { useAuthBroadcastChannel } from './hooks/useAuthBroadcastChannel'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthContext } from './AuthContext'
import { createLogger } from '@/lib/logger'

const logger = createLogger({ module: 'AuthProvider' }, 'error')

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
	onSignOut?: () => void
}

export const AuthProvider: React.FC<React.PropsWithChildren<AuthProviderProps>> = ({
	debug = false,
	refreshRetries = 0,
	signIn: signInHandler,
	signOut: signOutHandler,
	getSession: getSessionHandler,
	refreshAccessToken: refreshAccessTokenHandler,
	onSignOut,
	children,
}) => {
	logger.setLevel(debug ? 'debug' : logger.level)

	const [isLoading, setIsLoading] = useState(true)
	const [session, setSession] = useState<SessionResponse | undefined>()

	const timeoutId = useRef<NodeJS.Timeout | undefined>(undefined)
	const intervalId = useRef<NodeJS.Timeout | undefined>(undefined)
	const refreshRetriesCount = useRef<number>(0)

	/**
	 * Clear any active timer.
	 *
	 */
	const clearTimers = useCallback(() => {
		clearTimeout(timeoutId.current)
		clearInterval(intervalId.current)

		logger.log({ timeoutId: timeoutId.current, intervalId: intervalId.current }, 'Timers cleared.')

		timeoutId.current = undefined
		intervalId.current = undefined
	}, [])

	const clearSession = useCallback(() => {
		setSession(undefined)
		clearTimers()
		onSignOut?.()
	}, [clearTimers, onSignOut])

	const { broadcastAuthSessionUpdate, broadcastAuthSessionEnd } = useAuthBroadcastChannel<
		SessionResponse | undefined
	>({
		onSessionUpdate: setSession,
		onSignOut: clearSession,
	})

	const updateSession = useCallback(
		(session?: SessionResponse) => {
			setSession(session)
			broadcastAuthSessionUpdate(session)
		},
		[broadcastAuthSessionUpdate],
	)

	/**
	 * Sign out and clear timers.
	 *
	 */
	const signOut = useCallback(async () => {
		clearSession()

		broadcastAuthSessionEnd()
		await signOutHandler()

		logger.log('Sign-out successful.')
	}, [clearSession, signOutHandler, broadcastAuthSessionEnd])

	/**
	 * Refresh access token.
	 *
	 */
	const refreshAccessToken = useCallback<RefreshAccessTokenHandler>(async () => {
		const result = await refreshAccessTokenHandler()

		updateSession(result)

		logger.log(
			{ timeoutId: timeoutId.current, intervalId: intervalId.current },
			'Access token refreshed.',
		)

		return result
	}, [updateSession, refreshAccessTokenHandler])

	/**
	 * Start refresh interval.
	 *
	 */
	const startRefreshInterval = useCallback(
		(expDate: Date) => {
			const expiresMs = expDate.getTime() - Date.now()

			clearInterval(intervalId.current)

			/**
			 * Start refresh interval with retries.
			 *
			 */
			intervalId.current = setInterval(async () => {
				try {
					await refreshAccessToken()
					refreshRetriesCount.current = 0
				} catch (error) {
					refreshRetriesCount.current = refreshRetriesCount.current + 1

					if (refreshRetriesCount.current >= refreshRetries) {
						logger.warn({ intervalId: intervalId.current }, 'Max refresh retries reached.')
						await signOut()
					}

					throw error
				}
			}, expiresMs)

			logger.log(
				{ nextRefresh: expDate, intervalId: intervalId.current },
				'Started refresh access token interval.',
			)
		},
		[refreshRetries, refreshAccessToken, signOut],
	)

	/**
	 * Sign in and start refresh interval.
	 *
	 */
	const signIn = useCallback<SignInHandler>(
		async (...args) => {
			const session = await signInHandler(...args)

			updateSession(session)

			const { accessJwtExp } = session

			if (accessJwtExp) {
				startRefreshInterval(new Date(accessJwtExp))
			}

			logger.log({ session }, 'Sign-in successful.')

			return session
		},
		[signInHandler, updateSession, startRefreshInterval],
	)

	/**
	 * Start timeout then refresh interval.
	 *
	 */
	const startRefreshIntervalOnTimeout = useCallback(
		(expDate: Date) => {
			const expiresMs = expDate.getTime() - Date.now()

			clearTimeout(timeoutId.current)

			timeoutId.current = setTimeout(async () => {
				timeoutId.current = undefined

				const { accessJwtExp } = await refreshAccessToken()

				if (accessJwtExp) {
					startRefreshInterval(new Date(accessJwtExp))
				}
			}, expiresMs)

			logger.log(
				{ nextRefresh: expDate, timeoutId: timeoutId.current },
				'Started refresh access token timeout.',
			)
		},
		[refreshAccessToken, startRefreshInterval],
	)

	/**
	 * Fetch session.
	 *
	 */
	const fetchSession = useCallback(async () => {
		const session = await getSessionHandler()

		logger.log({ session }, 'Fetched session data.')

		return session
	}, [getSessionHandler])

	/**
	 * Fetch session on page load and start refresh interval when access token expires.
	 *
	 */
	useEffect(() => {
		fetchSession()
			.then(async session => {
				updateSession(session)
				setIsLoading(false)

				if (session.accessJwtExp) {
					startRefreshIntervalOnTimeout(new Date(session.accessJwtExp))
				}
			})
			.catch(error => logger.error({ error }, 'Initial get session failed.'))

		return () => {
			clearTimers()
		}
	}, [updateSession, fetchSession, startRefreshIntervalOnTimeout, clearTimers])

	return (
		<AuthContext.Provider value={{ session, isLoading, signIn, signOut }}>
			{children}
		</AuthContext.Provider>
	)
}
