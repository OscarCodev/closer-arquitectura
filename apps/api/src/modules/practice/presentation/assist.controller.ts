import { Body, Controller, HttpCode, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RateLimit } from '../../../shared/presentation/rate-limit.guard'
import { ExtractProfileUseCase, GenerateScenarioUseCase } from '../application/ai-assist.use-cases'
import { ExtractedProfileDto, ExtractProfileDto, ScenarioDto } from './practice.dto'

@ApiTags('Asistente de IA')
@ApiBearerAuth()
@Controller('assist')
export class AssistController {
  constructor(
    private readonly extractProfile: ExtractProfileUseCase,
    private readonly generateScenario: GenerateScenarioUseCase,
  ) {}

  @Post('extract-profile')
  @HttpCode(200)
  @RateLimit(
    { name: 'assist-extract-burst', limit: 20, windowSeconds: 60, message: 'Demasiadas solicitudes de perfil en poco tiempo.' },
    { name: 'assist-extract-hour', limit: 120, windowSeconds: 3600, message: 'Alcanzaste el límite horario de extracción de perfil.' },
  )
  @ApiOperation({ summary: 'Extrae nombre, cargo, empresa y género de una descripción libre' })
  @ApiOkResponse({ type: ExtractedProfileDto })
  extract(@Body() body: ExtractProfileDto): Promise<ExtractedProfileDto> {
    return this.extractProfile.execute(body.prospect)
  }

  @Post('scenario')
  @HttpCode(200)
  @RateLimit(
    { name: 'assist-scenario-burst', limit: 10, windowSeconds: 60, message: 'Demasiados escenarios en poco tiempo.' },
    { name: 'assist-scenario-hour', limit: 60, windowSeconds: 3600, message: 'Alcanzaste el límite horario de escenarios.' },
  )
  @ApiOperation({ summary: 'Genera un escenario de práctica (botón "Autocompletar")' })
  @ApiOkResponse({ type: ScenarioDto })
  scenario(): Promise<ScenarioDto> {
    return this.generateScenario.execute()
  }
}
