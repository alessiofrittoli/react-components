import {
	BroadcastChannel,
	type DispatchActionFromMap,
	type OnMessageEventListener,
} from '@/lib/BroadcastChannelAPI'
import { useCallback, useEffect, useMemo } from 'react'

export const AuthEvent = {
	SessionUpdate: 'auth-broadcast:session-update',
	SessionEnd: 'auth-broadcast:session-end',
} as const

export type AuthEvent = (typeof AuthEvent)[keyof typeof AuthEvent]

export interface AuthEventMap<T> {
	[AuthEvent.SessionUpdate]: [session?: T]
	[AuthEvent.SessionEnd]: undefined
}

export type AuthEventAction<T> = DispatchActionFromMap<AuthEventMap<T>>

export interface UseAuthBroadcastChannelParams<T> {
	debug?: boolean
	onSessionUpdate: (...args: AuthEventMap<T>[typeof AuthEvent.SessionUpdate]) => void
	onSignOut: () => void
}

export interface UseAuthBroadcastChannel<T> {
	channel: BroadcastChannel<AuthEventAction<T>>
	broadcastAuthSessionUpdate: (...args: AuthEventMap<T>[typeof AuthEvent.SessionUpdate]) => void
	broadcastAuthSessionEnd: () => void
}

export const useAuthBroadcastChannel = <T>(
	params: UseAuthBroadcastChannelParams<T>,
): UseAuthBroadcastChannel<T> => {
	const { debug = false, onSessionUpdate, onSignOut } = params

	const channel = useMemo(() => new BroadcastChannel<AuthEventAction<T>>('auth', { debug }), [debug])

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
					onSessionUpdate(session)
					break
				}
				case AuthEvent.SessionEnd: {
					onSignOut()
					break
				}
			}
		}

		channel.addEventListener('message', onChannelMessage)

		return () => {
			channel.removeEventListener('message', onChannelMessage)
			channel.destroy()
		}
	}, [channel, onSessionUpdate, onSignOut])

	return { channel, broadcastAuthSessionUpdate, broadcastAuthSessionEnd }
}
