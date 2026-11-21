import { Body, Controller, HttpCode, NotFoundException, Post } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { createHash } from 'node:crypto'
import { SignJWT } from 'jose'
import { AppConfig } from '../../../shared/infrastructure/config/app-config.service'
import { Public } from './auth.guard'
import { DevTokenRequestDto, DevTokenResponseDto } from './identity.dto'

const EXPIRES_IN_SECONDS = 60 * 60

/** UUID estable a partir del email, para que el mismo usuario de prueba conserve sus datos. */
function uuidFromEmail(email: string) {
  const hex = createHash('sha256').update(email.toLowerCase()).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}

/**
 * Emite tokens con la misma forma que Supabase (HS256, `sub`, `email`, `role: authenticated`).
 * Solo existe con AUTH_DEV_LOGIN=true fuera de producción: lo usan el desarrollo local, Playwright y k6.
 */
@ApiTags('Identidad')
@Controller('auth')
export class DevAuthController {
  constructor(private readonly config: AppConfig) {}

  @Public()
  @Post('dev-token')
  @HttpCode(200)
  @ApiOperation({ summary: '[Solo desarrollo] Token de prueba sin Supabase' })
  @ApiOkResponse({ type: DevTokenResponseDto })
  async devToken(@Body() body: DevTokenRequestDto): Promise<DevTokenResponseDto> {
    if (!this.config.devLoginEnabled) throw new NotFoundException()

    const userId = uuidFromEmail(body.email)
    const accessToken = await new SignJWT({ email: body.email, role: 'authenticated' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(`${EXPIRES_IN_SECONDS}s`)
      .sign(new TextEncoder().encode(this.config.get('AUTH_JWT_SECRET')))

    return { accessToken, userId, expiresIn: EXPIRES_IN_SECONDS }
  }
}
