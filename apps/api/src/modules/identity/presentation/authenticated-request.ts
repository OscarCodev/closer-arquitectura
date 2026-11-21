import type { Request } from 'express'
import type { AuthenticatedUser } from '../domain/authenticated-user'

export type AuthenticatedRequest = Request & { user: AuthenticatedUser }
