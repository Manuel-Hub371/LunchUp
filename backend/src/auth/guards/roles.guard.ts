import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@prisma/client'
import { ROLES_KEY } from '../../common/decorators'
import { ApiException } from '../../common/api-exception'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required || required.length === 0) return true

    const request = context.switchToHttp().getRequest<{ user?: { role?: Role } }>()
    const user = request.user
    if (!user) throw ApiException.unauthorized()
    if (!required.includes(user.role as Role)) {
      throw ApiException.forbidden()
    }
    return true
  }
}