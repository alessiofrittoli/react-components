import type { DispatchActionFromMap, OnMessageEventListener } from '@alessiofrittoli/web-utils/broadcast'
import { BroadcastChannel } from '@alessiofrittoli/web-utils/broadcast'
import type { LogLevel } from '@alessiofrittoli/console/logger'
import { useCallback, useEffect, useMemo } from 'react'

export const AuthEvent = {
	SessionUpdate: 'auth:session-update',
	SessionEnd: 'auth:session-end',
} as const

export type AuthEvent = (typeof AuthEvent)[keyof typeof AuthEvent]

export interface AuthEventMap<T> {
	[AuthEvent.SessionUpdate]: [session?: T]
	[AuthEvent.SessionEnd]: undefined
}

export type AuthEventAction<T> = DispatchActionFromMap<AuthEventMap<T>>

export interface UseAuthBroadcastChannelParams<T> {
	/**
	 * Defines log level.
	 *
	 * @default 'error'
	 */
	logLevel?: LogLevel
	/**
	 * Update session data when a session update event is received from the auth broadcast channel.
	 *
	 */
	onAuthSessionUpdate: (...args: AuthEventMap<T>[typeof AuthEvent.SessionUpdate]) => void
	/**
	 * A callback executed to clear session when auth SessionEnd event is received from the auth broadcast channel.
	 *
	 */
	onAuthSessionEnd: () => void
}

export interface UseAuthBroadcastChannel<T> {
	/**
	 * The current `BroadcastChannel` instance.
	 *
	 */
	channel: BroadcastChannel<AuthEventAction<T>>
	/**
	 * Notify session update through auth broadcast channel.
	 *
	 */
	broadcastAuthSessionUpdate: (...args: AuthEventMap<T>[typeof AuthEvent.SessionUpdate]) => void
	/**
	 * Notify auth session end through auth broadcast channel.
	 *
	 */
	broadcastAuthSessionEnd: () => void
}

export const useAuthBroadcastChannel = <T>(
	params: UseAuthBroadcastChannelParams<T>,
): UseAuthBroadcastChannel<T> => {
	const { logLevel, onAuthSessionUpdate, onAuthSessionEnd } = params

	const channel = useMemo(() => new BroadcastChannel<AuthEventAction<T>>('auth', { logLevel }), [logLevel])

	const broadcastAuthSessionUpdate = useCallback(
		(...args: AuthEventMap<T>[typeof AuthEvent.SessionUpdate]) => {
			channel.postMessage({ type: AuthEvent.SessionUpdate, payload: [...args] })
		},
		[channel],
	)

	const broadcastAuthSessionEnd = useCallback(() => {
		channel.postMessage({ type: AuthEvent.SessionEnd })
	}, [channel])

	useEffect(() => {
		const onChannelMessage: OnMessageEventListener<AuthEventAction<T>> = event => {
			switch (event.data.type) {
				case AuthEvent.SessionUpdate: {
					const [session] = event.data.payload
					onAuthSessionUpdate(session)
					break
				}
				case AuthEvent.SessionEnd: {
					onAuthSessionEnd()
					break
				}
			}
		}

		channel.addEventListener('message', onChannelMessage)

		return () => {
			channel.removeEventListener('message', onChannelMessage)
			channel.destroy()
		}
	}, [channel, onAuthSessionUpdate, onAuthSessionEnd])

	return { channel, broadcastAuthSessionUpdate, broadcastAuthSessionEnd }
}
