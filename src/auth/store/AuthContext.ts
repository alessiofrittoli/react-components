import type { AuthCtx } from '@/auth/types'
import { createContext } from 'react'

export const AuthContext = createContext<AuthCtx<unknown> | undefined>(undefined)

AuthContext.displayName = 'AuthContext'
