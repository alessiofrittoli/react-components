/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext } from 'react'

export type SessionResponse<T = unknown> = T & {
	/**
	 * The access token expiration date.
	 *
	 * It could be a date ISO string, milliseconds since UNIX epoch time or a Date object.
	 */
	accessJwtExp?: string | number | Date
}

export type SignInHandler<T = unknown> = <U extends any[]>(
	...args: U
) => SessionResponse<T> | Promise<SessionResponse<T>>

export type SignOutHandler = () => void | Promise<void>

export interface AuthCtx<T> {
	/**
	 * The current session.
	 *
	 */
	session?: SessionResponse<T>
	/**
	 * Indicates whether is currently fetching session on page load.
	 *
	 */
	isLoading: boolean
	/**
	 * Sign in.
	 *
	 */
	signIn: SignInHandler<T>
	/**
	 * Sign out.
	 *
	 */
	signOut: SignOutHandler
}

export const AuthContext = createContext<AuthCtx<unknown> | undefined>(undefined)

AuthContext.displayName = 'AuthContext'
