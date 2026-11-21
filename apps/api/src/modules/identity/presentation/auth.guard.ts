import { CanActivate, createParamDecorator, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UnauthenticatedError } from '../../../shared/domain/errors'
import { AuthenticateUseCase } from '../application/authenticate.use-case'
import type { AuthenticatedUser } from '../domain/authenticated-user'
import type { AuthenticatedRequest } from './authenticated-request'

const IS_PUBLIC = 'is-public'

/** Marca un endpoint como público (sin token). Todo lo demás exige `Authorization: Bearer`. */
export const Public = () => SetMetadata(IS_PUBLIC, true)

/** Inyecta el usuario autenticado en el handler. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
)

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authenticate: AuthenticateUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])
    if (isPublic) return true

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const header = request.headers.authorization ?? ''
    const [scheme, token] = header.split(' ')
    if (scheme !== 'Bearer' || !token) throw new UnauthenticatedError('Falta el token de acceso')

    request.user = await this.authenticate.execute(token)
    return true
  }
}
