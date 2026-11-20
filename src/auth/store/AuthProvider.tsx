'use client'

import type {
	AnonymousSignInHandler,
	GetSessionHandler,
	RefreshAccessTokenHandler,
	SignInHandler,
	AuthSessionData,
	SignOutHandler,
} from '@/auth/types'
import { useAuthBroadcastChannel } from '@/auth/hooks/useAuthBroadcastChannel'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createLogger } from '@alessiofrittoli/console/logger'
import { LockManager } from '@alessiofrittoli/web-utils/lock'
import { AuthContext } from '@/auth/store/AuthContext'

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
	 * Initial session data.
	 *
	 * This could be defined by the server and will prevent session data fetch on component mount.
	 */
	session?: AuthSessionData<T>
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
	session: initialSession,
	signIn: signInHandler,
	signOut: signOutHandler,
	getSession: getSessionHandler,
	refreshAccessToken: refreshAccessTokenHandler,
	onSignOut,
	children,
}) => {
	const logLevel = debug ? 'debug' : logger.level

	logger.setLevel(logLevel)

	const refreshLockManager = useMemo(() => new LockManager({ logLevel }), [logLevel])

	const [isLoading, setIsLoading] = useState(true)
	const [session, setSession] = useState<AuthSessionData | undefined>(initialSession)

	const timeoutId = useRef<NodeJS.Timeout | undefined>(undefined)
	const refreshRetriesCount = useRef<number>(0)

	const sessionExp = useRef(session?.accessJwtExp)
	// eslint-disable-next-line react-hooks/refs
	sessionExp.current = session?.accessJwtExp

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
		AuthSessionData | undefined
	>({
		logLevel,
		onAuthSessionUpdate: setSession,
		onAuthSessionEnd: clearSession,
	})

	/**
	 * Update session state and broadcast session update through `BroadcastChannel`.
	 *
	 */
	const updateSession = useCallback(
		(session?: AuthSessionData) => {
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
	 * Access token refresh loop.
	 *
	 */
	const refreshLoop = useCallback(
		(expDate: Date) => {
			clearTimeout(timeoutId.current)

			const expiresMs = expDate.getTime() - Date.now()

			logger.log(
				{ nextRefresh: expDate, timeoutId: timeoutId.current },
				!timeoutId.current ? 'Started refresh access token loop.' : 'Refresh access token loop tick.',
			)

			timeoutId.current = setTimeout(async () => {
				try {
					const { accessJwtExp } = await refreshAccessToken()

					refreshRetriesCount.current = 0

					if (accessJwtExp) {
						// eslint-disable-next-line react-hooks/immutability
						refreshLoop(new Date(accessJwtExp))
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

					refreshLoop(nextAttempt)
				}
			}, expiresMs)
		},
		[refreshRetries, refreshAccessToken, signOut],
	)

	/**
	 * Start refresh loop.
	 *
	 */
	const startRefreshLoop = useCallback(
		(expDate: Date) => {
			refreshLockManager
				.request('access-token-refresh', { releaseOnPageClose: true }, async lock => {
					logger.log({ lock }, 'Access token refresh lock granted.')

					/**
					 * Indicates whether `expDate` received as argument is now stale.
					 *
					 * This means that `LockManager` granted us lock to token refresh thus an another
					 * tab that was previously locking the token refresh has been closed.
					 */
					const isExpStale = expDate < new Date()

					const expiration =
						isExpStale && sessionExp.current ? new Date(sessionExp.current) : expDate

					refreshLoop(expiration)
				})
				.catch(error => logger.error({ error }, 'Failed to acquire auth refresh lock.'))
		},
		[refreshLockManager, refreshLoop],
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
		;(initialSession ? Promise.resolve(initialSession) : fetchSession())
			.then(async session => {
				if (session.accessJwtExp) {
					startRefreshLoop(new Date(session.accessJwtExp))
				}

				updateSession(session)
				setIsLoading(false)
			})
			.catch(error => logger.error({ error }, 'Initial get session failed.'))

		return () => {
			clearTimers()
			refreshLockManager.release()
		}
	}, [initialSession, refreshLockManager, updateSession, fetchSession, startRefreshLoop, clearTimers])

	return (
		<AuthContext.Provider value={{ session, isLoading, signIn, signOut }}>
			{children}
		</AuthContext.Provider>
	)
}
