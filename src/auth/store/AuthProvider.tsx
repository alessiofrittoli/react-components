'use client'

import type {
	AnonymousSignInHandler,
	GetSessionHandler,
	RefreshAccessTokenHandler,
	SignInHandler,
	SessionResponse,
	SignOutHandler,
} from '@/auth/types'
import { useAuthBroadcastChannel } from '../hooks/useAuthBroadcastChannel'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthContext } from '@/auth/store/AuthContext'
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
	/**
	 * A custom callback executed on sign-out.
	 *
	 */
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
	const refreshRetriesCount = useRef<number>(0)

	/**
	 * Clear any active timer.
	 *
	 */
	const clearTimers = useCallback(() => {
		clearTimeout(timeoutId.current)

		logger.log({ timeoutId: timeoutId.current }, 'Timers cleared.')

		timeoutId.current = undefined
	}, [])

	/**
	 * Clear session state, timers and call external `onSignOut` callback.
	 *
	 */
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

	/**
	 * Update session state and broadcast session update through `BroadcastChannel`.
	 *
	 */
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

		logger.log({ timeoutId: timeoutId.current }, 'Access token refreshed.')

		return result
	}, [updateSession, refreshAccessTokenHandler])

	/**
	 * Start refresh loop.
	 *
	 */
	const startRefreshLoop = useCallback(
		(expDate: Date) => {
			const expiresMs = expDate.getTime() - Date.now()

			clearTimeout(timeoutId.current)

			timeoutId.current = setTimeout(async () => {
				try {
					const { accessJwtExp } = await refreshAccessToken()

					refreshRetriesCount.current = 0

					if (accessJwtExp) {
						// eslint-disable-next-line react-hooks/immutability
						startRefreshLoop(new Date(accessJwtExp))
						return
					}
				} catch (error) {
					refreshRetriesCount.current = refreshRetriesCount.current + 1

					if (refreshRetriesCount.current >= refreshRetries) {
						logger.error(
							{ error, timeoutId: timeoutId.current },
							'Refresh failed - Max refresh retries reached.',
						)
						return await signOut()
					}

					const nextAttempt = new Date(Date.now() + 1 * 60 * 1000)

					logger.error({ error, timeoutId: timeoutId.current, nextAttempt }, 'Refresh failed.')

					startRefreshLoop(nextAttempt)
				}
			}, expiresMs)

			logger.log(
				{ nextRefresh: expDate, timeoutId: timeoutId.current },
				'Started refresh access token timeout.',
			)
		},
		[refreshAccessToken, refreshRetries, signOut],
	)

	/**
	 * Sign in and start refresh interval.
	 *
	 */
	const signIn = useCallback<SignInHandler>(
		async (...args) => {
			const session = await signInHandler(...args)

			logger.log({ session }, 'Sign-in successful.')

			updateSession(session)

			const { accessJwtExp } = session

			if (accessJwtExp) {
				startRefreshLoop(new Date(accessJwtExp))
			}

			return session
		},
		[signInHandler, updateSession, startRefreshLoop],
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
					startRefreshLoop(new Date(session.accessJwtExp))
				}
			})
			.catch(error => logger.error({ error }, 'Initial get session failed.'))

		return () => {
			clearTimers()
		}
	}, [updateSession, fetchSession, startRefreshLoop, clearTimers])

	return (
		<AuthContext.Provider value={{ session, isLoading, signIn, signOut }}>
			{children}
		</AuthContext.Provider>
	)
}
