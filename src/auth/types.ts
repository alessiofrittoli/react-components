export type AuthSessionData<T = unknown> = T & {
	/**
	 * The access token expiration date.
	 *
	 * It could be a date ISO string, milliseconds since UNIX epoch time or a Date object.
	 */
	accessJwtExp?: string | number | Date
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SignInHandler<T = unknown> = <U extends any[]>(
	...args: U
) => AuthSessionData<T> | Promise<AuthSessionData<T>>

export type SignOutHandler = () => void | Promise<void>

export interface AuthCtx<T> {
	/**
	 * The current session.
	 *
	 */
	session?: AuthSessionData<T>
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

export type AnonymousSignInHandler<T = unknown> = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	...args: any[]
) => AuthSessionData<T> | Promise<AuthSessionData<T>>

export type GetSessionHandler<T = unknown> = () => AuthSessionData<T> | Promise<AuthSessionData<T>>
export type RefreshAccessTokenHandler<T = unknown> = () => AuthSessionData<T> | Promise<AuthSessionData<T>>
