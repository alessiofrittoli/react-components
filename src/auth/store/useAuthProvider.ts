import { AuthContext } from '@/auth/store/AuthContext'
import type { AuthCtx } from '@/auth/types'
import { useContext } from 'react'

/**
 * Access `AuthProvider` data.
 *
 * @returns the `AuthProvider` data.
 */
export const useAuthProvider = <T>(): AuthCtx<T> => {
	const context = useContext(AuthContext)

	if (!context) {
		throw new Error('useAuthProvider has been called outside the AuthProvider Component.')
	}

	return context as AuthCtx<T>
}
