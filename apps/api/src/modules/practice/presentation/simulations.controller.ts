import { Body, Controller, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { RateLimit } from '../../../shared/presentation/rate-limit.guard'
import type { AuthenticatedUser } from '../../identity/domain/authenticated-user'
import { CurrentUser } from '../../identity/presentation/auth.guard'
import { CoachTipUseCase } from '../application/ai-assist.use-cases'
import { EvaluateSimulationUseCase } from '../application/evaluate-simulation.use-case'
import { MAX_CALL_MINUTES, StartSimulationUseCase } from '../application/start-simulation.use-case'
import {
  CoachTipDto,
  EvaluateSimulationDto,
  EvaluateSimulationResponseDto,
  SessionDto,
  StartSimulationDto,
  StartSimulationResponseDto,
  TranscriptBodyDto,
} from './practice.dto'

@ApiTags('Simulaciones')
@ApiBearerAuth()
@Controller('simulations')
export class SimulationsController {
  constructor(
    private readonly startSimulation: StartSimulationUseCase,
    private readonly evaluateSimulation: EvaluateSimulationUseCase,
    private readonly coachTip: CoachTipUseCase,
  ) {}

  @Post()
  @RateLimit(
    { name: 'sim-start-burst', limit: 6, windowSeconds: 60, message: 'Has iniciado demasiadas llamadas. Reintenta en unos segundos.' },
    { name: 'sim-start-hour', limit: 40, windowSeconds: 3600, message: 'Alcanzaste el límite horario de llamadas.' },
  )
  @ApiOperation({
    summary: 'Inicia un intento de práctica',
    description:
      'Crea la sesión (o reutiliza `sessionId` para reintentar), registra la simulación en estado IN_CALL y devuelve un token efímero de voz con el prompt del prospecto bloqueado en el servidor.',
  })
  @ApiCreatedResponse({ type: StartSimulationResponseDto })
  async start(@CurrentUser() user: AuthenticatedUser, @Body() body: StartSimulationDto): Promise<StartSimulationResponseDto> {
    const input = body.sessionId
      ? { sessionId: body.sessionId }
      : {
          context: body.context ?? '',
          prospect: body.prospect ?? '',
          prospectName: body.prospectName,
          prospectRole: body.prospectRole,
          prospectCompany: body.prospectCompany,
          advancedSelections: body.advancedSelections,
        }
    const { simulationId, session, live } = await this.startSimulation.execute(user.id, input)
    const sessionDto = SessionDto.from({ ...session, simulations: [] })
    return {
      simulationId,
      session: sessionDto,
      prospect: { name: session.scenario.prospectName, role: session.scenario.prospectRole, company: session.scenario.prospectCompany },
      live,
      maxCallMinutes: MAX_CALL_MINUTES,
    }
  }

  @Post(':id/evaluate')
  @HttpCode(200)
  @RateLimit(
    { name: 'sim-eval-burst', limit: 4, windowSeconds: 60, message: 'Demasiados análisis en poco tiempo.' },
    { name: 'sim-eval-hour', limit: 24, windowSeconds: 3600, message: 'Alcanzaste el límite horario de análisis.' },
  )
  @ApiOperation({
    summary: 'Evalúa la llamada terminada (idempotente)',
    description:
      'El servidor calcula y guarda el puntaje. Si ya fue evaluada devuelve el resultado guardado; si la IA falla responde 502 y se puede reintentar.',
  })
  @ApiOkResponse({ type: EvaluateSimulationResponseDto })
  @ApiConflictResponse({ description: 'Otra petición está evaluando esta llamada' })
  async evaluate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: EvaluateSimulationDto,
  ): Promise<EvaluateSimulationResponseDto> {
    const session = SessionDto.from(await this.evaluateSimulation.execute(user.id, id, body))
    const simulation = session.simulations.find((sim) => sim.id === id)!
    return { session, simulation }
  }

  @Post(':id/coach')
  @HttpCode(200)
  @RateLimit(
    { name: 'sim-coach-burst', limit: 18, windowSeconds: 60, message: 'Demasiadas solicitudes de consejo en poco tiempo.' },
    { name: 'sim-coach-hour', limit: 180, windowSeconds: 3600, message: 'Alcanzaste el límite horario de consejos.' },
  )
  @ApiOperation({ summary: 'Consejo en vivo para el siguiente turno del vendedor' })
  @ApiOkResponse({ type: CoachTipDto })
  async coach(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: TranscriptBodyDto,
  ): Promise<CoachTipDto> {
    return { tip: await this.coachTip.execute(user.id, id, body.transcript) }
  }
}
