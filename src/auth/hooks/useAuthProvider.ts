import { AuthContext, type AuthCtx } from '../AuthContext'
import { useContext } from 'react'

export const useAuthProvider = <T>(): AuthCtx<T> => {
	const context = useContext(AuthContext)

	if (!context) {
		throw new Error('useAuthProvider has been called outside the AuthProvider Component.')
	}

	return context as AuthCtx<T>
}
