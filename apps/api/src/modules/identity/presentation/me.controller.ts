import { Body, Controller, Get, Put } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { GetOnboardingUseCase, SaveOnboardingUseCase } from '../application/onboarding.use-cases'
import type { AuthenticatedUser } from '../domain/authenticated-user'
import { CurrentUser } from './auth.guard'
import { MeResponseDto, OnboardingDto, OnboardingResponseDto } from './identity.dto'

@ApiTags('Identidad')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(
    private readonly getOnboarding: GetOnboardingUseCase,
    private readonly saveOnboarding: SaveOnboardingUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Usuario autenticado y estado de su onboarding' })
  @ApiOkResponse({ type: MeResponseDto })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<MeResponseDto> {
    const onboarding = await this.getOnboarding.execute(user.id)
    return { id: user.id, email: user.email, onboardingCompleted: onboarding !== null }
  }

  @Get('onboarding')
  @ApiOperation({ summary: 'Respuestas del onboarding (null si no lo completó)' })
  @ApiOkResponse({ type: OnboardingResponseDto })
  async onboarding(@CurrentUser() user: AuthenticatedUser): Promise<OnboardingResponseDto> {
    const result = await this.getOnboarding.execute(user.id)
    return { onboarding: result ? { ...result.answers, completedAt: result.completedAt.toISOString() } : null }
  }

  @Put('onboarding')
  @ApiOperation({ summary: 'Guarda o actualiza el onboarding (también desde Ajustes)' })
  @ApiOkResponse({ type: OnboardingResponseDto })
  async save(@CurrentUser() user: AuthenticatedUser, @Body() body: OnboardingDto): Promise<OnboardingResponseDto> {
    const result = await this.saveOnboarding.execute(user.id, { ...body })
    return { onboarding: { ...result.answers, completedAt: result.completedAt.toISOString() } }
  }
}
