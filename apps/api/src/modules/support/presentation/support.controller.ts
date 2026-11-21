import { Body, Controller, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'
import { RateLimit } from '../../../shared/presentation/rate-limit.guard'
import type { AuthenticatedUser } from '../../identity/domain/authenticated-user'
import { CurrentUser } from '../../identity/presentation/auth.guard'
import { SendSupportContactUseCase } from '../application/send-support-contact.use-case'

export class SupportContactDto {
  @ApiProperty({ example: 'No escucho al prospecto' }) @IsString() @MaxLength(200) subject: string
  @ApiProperty({ example: 'Al iniciar la llamada no se oye la voz del prospecto.' }) @IsString() @MaxLength(5000) message: string
  @ApiPropertyOptional({ example: '/setup' }) @IsOptional() @IsString() @MaxLength(300) pagePath?: string
}

export class SupportContactResponseDto {
  @ApiProperty() ok: boolean
  @ApiProperty({ description: 'false si no hay webhook configurado (el mensaje igual queda guardado)' }) delivered: boolean
}

@ApiTags('Soporte')
@ApiBearerAuth()
@Controller('support')
export class SupportController {
  constructor(private readonly send: SendSupportContactUseCase) {}

  @Post('contacts')
  @RateLimit(
    { name: 'support-burst', limit: 2, windowSeconds: 60, message: 'Espera un momento antes de enviar otro mensaje.' },
    { name: 'support-hour', limit: 8, windowSeconds: 3600, message: 'Alcanzaste el límite horario de mensajes a soporte.' },
  )
  @ApiOperation({ summary: 'Envía un mensaje a soporte' })
  @ApiCreatedResponse({ type: SupportContactResponseDto })
  async contact(@CurrentUser() user: AuthenticatedUser, @Body() body: SupportContactDto): Promise<SupportContactResponseDto> {
    const { delivered } = await this.send.execute(user, { ...body })
    return { ok: true, delivered }
  }
}
