import { ExecutionContext, SetMetadata, createParamDecorator } from '@nestjs/common'
import { Role, User } from '@prisma/client'

export const IS_PUBLIC_KEY = 'isPublic'
export const ROLES_KEY = 'roles'

/** Marks a route as accessible without authentication. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)

/** Restricts a route to the given roles. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)

export interface AuthenticatedUser {
  id: string
  email: string
  role: Role
}

/** Injects `request.user` (set by the JWT strategy) as an `AuthenticatedUser`. */
export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>()
    return request.user as AuthenticatedUser
  }
)

export type PublicUserShape = Pick<User, 'id' | 'email' | 'name' | 'phone' | 'role' | 'status' | 'avatarUrl' | 'createdAt'>