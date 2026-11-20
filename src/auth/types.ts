import type { SessionResponse } from './AuthContext'

export type AnonymousSignInHandler<T = unknown> = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	...args: any[]
) => SessionResponse<T> | Promise<SessionResponse<T>>

export type GetSessionHandler<T = unknown> = () => SessionResponse<T> | Promise<SessionResponse<T>>
export type RefreshAccessTokenHandler<T = unknown> = () => SessionResponse<T> | Promise<SessionResponse<T>>
