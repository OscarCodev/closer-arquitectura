import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator'
import type { SessionWithSimulations, SimulationRecord } from '../domain/practice-session'
import type { SimulationAnalysis } from '../domain/types'

/* ── Entrada ──────────────────────────────────────────────────────── */

export class AdvancedSelectionsDto {
  @ApiProperty({ example: 'Descubrimiento' }) @IsString() @MaxLength(40) modo: string
  @ApiProperty({ example: 'Analítico' }) @IsString() @MaxLength(40) tono: string
}

export class StartSimulationDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Reintento: reutiliza el escenario de esta sesión e ignora el resto de campos' })
  @IsOptional()
  @IsUUID()
  sessionId?: string

  @ApiPropertyOptional({ example: 'Vendo FlowCRM, un CRM para equipos comerciales…' }) @IsOptional() @IsString() @MaxLength(1400) context?: string
  @ApiPropertyOptional({ example: 'Lucía Fernández, Head of Sales en Nubia Retail…' }) @IsOptional() @IsString() @MaxLength(1400) prospect?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) prospectName?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) prospectRole?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) prospectCompany?: string

  @ApiPropertyOptional({ type: AdvancedSelectionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdvancedSelectionsDto)
  advancedSelections?: AdvancedSelectionsDto
}

export class TranscriptItemDto {
  @ApiProperty({ enum: ['user', 'model'] }) @IsIn(['user', 'model']) role: 'user' | 'model'
  @ApiProperty() @IsString() @MaxLength(6000) text: string
  @ApiPropertyOptional({ description: 'epoch ms' }) @IsOptional() @IsNumber() startedAt?: number
  @ApiPropertyOptional({ description: 'epoch ms' }) @IsOptional() @IsNumber() endedAt?: number
}

export class TranscriptBodyDto {
  @ApiProperty({ type: [TranscriptItemDto] })
  @IsArray()
  @ArrayMaxSize(400)
  @ValidateNested({ each: true })
  @Type(() => TranscriptItemDto)
  transcript: TranscriptItemDto[]
}

export class EvaluateSimulationDto extends TranscriptBodyDto {
  @ApiProperty({ example: 184, description: 'Duración de la llamada en segundos' })
  @IsInt()
  @Min(0)
  @Max(3600)
  durationSeconds: number
}

export class RenameSessionDto {
  @ApiProperty({ example: 'Lucía: Descubrimiento de dolor' }) @IsString() @MaxLength(120) name: string
}

export class ExtractProfileDto {
  @ApiProperty({ example: 'Martín Rojas, CFO en Andes Market…' }) @IsString() @MaxLength(1400) prospect: string
}

/* ── Salida (misma forma que los tipos del frontend) ──────────────── */

export class SessionMetricsDto {
  @ApiProperty() score: number
  @ApiProperty({ example: '03:04' }) duration: string
  @ApiProperty() turns: number
  @ApiProperty() errors: number
  @ApiProperty() mejorables: number
  @ApiProperty() brillantes: number
  @ApiProperty() neutros: number
}

export class ConversationTurnDto {
  @ApiProperty() turn: number
  @ApiProperty({ description: 'Lo que dijo el prospecto (IA)' }) ia: string
  @ApiProperty({ description: 'Lo que dijo el vendedor' }) tu: string
  @ApiProperty({ enum: ['critical', 'warning', 'good', 'neutral'] }) evaluation: string
  @ApiProperty() title: string
  @ApiProperty() diagnostic: string
  @ApiProperty({ nullable: true, type: String }) improvement: string | null
}

export class SimulationContextDto {
  @ApiProperty() prospectName: string
  @ApiProperty() prospectRole: string
  @ApiProperty() prospectCompany: string
  @ApiProperty() prospectDescription: string
  @ApiProperty() salesContext: string
}

export class SimulationDto {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty({ format: 'date-time' }) createdAt: string
  @ApiProperty({ type: SessionMetricsDto }) metrics: SessionMetricsDto
  @ApiProperty({ type: SimulationContextDto }) context: SimulationContextDto
  @ApiProperty({ type: [ConversationTurnDto] }) conversation: ConversationTurnDto[]
  @ApiProperty() transcript: string
  @ApiProperty({ type: Object, description: 'Métricas de voz estimadas y radar de 5 habilidades' }) analysis: SimulationAnalysis
}

export class SessionDto {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty() name: string
  @ApiPropertyOptional() voiceName?: string
  @ApiProperty({ description: 'Nombre visible del prospecto' }) prospect: string
  @ApiProperty() context: string
  @ApiProperty({ format: 'date-time' }) createdAt: string
  @ApiProperty({ type: AdvancedSelectionsDto }) advancedSelections: AdvancedSelectionsDto
  @ApiProperty({ type: [SimulationDto], description: 'Intentos evaluados, del más antiguo al más reciente' }) simulations: SimulationDto[]

  static from(session: SessionWithSimulations): SessionDto {
    const s = session.scenario
    const context: SimulationContextDto = {
      prospectName: s.prospectName || 'Prospecto',
      prospectRole: s.prospectRole,
      prospectCompany: s.prospectCompany,
      prospectDescription: s.prospect,
      salesContext: s.context,
    }
    return {
      id: session.id,
      name: session.name,
      voiceName: session.voiceName ?? undefined,
      prospect: s.prospectName || s.prospect.slice(0, 60),
      context: s.context,
      createdAt: session.createdAt.toISOString(),
      advancedSelections: s.advancedSelections,
      simulations: session.simulations.filter((sim) => sim.result).map((sim) => SessionDto.simulation(sim, context)),
    }
  }

  static simulation(sim: SimulationRecord, context: SimulationContextDto): SimulationDto {
    const result = sim.result!
    return {
      id: sim.id,
      createdAt: sim.createdAt.toISOString(),
      metrics: result.metrics,
      context,
      conversation: result.conversation,
      transcript: result.transcript,
      analysis: result.analysis,
    }
  }
}

export class SessionListDto {
  @ApiProperty({ type: [SessionDto] }) sessions: SessionDto[]
}

export class LiveAccessDto {
  @ApiProperty({ enum: ['gemini', 'fake'] }) provider: 'gemini' | 'fake'
  @ApiProperty({ description: 'Token efímero de un solo uso' }) token: string
  @ApiProperty() model: string
  @ApiProperty() voiceName: string
  @ApiProperty({ format: 'date-time' }) expiresAt: string
}

export class ProspectSummaryDto {
  @ApiProperty() name: string
  @ApiProperty() role: string
  @ApiProperty() company: string
}

export class StartSimulationResponseDto {
  @ApiProperty({ format: 'uuid' }) simulationId: string
  @ApiProperty({ type: SessionDto }) session: SessionDto
  @ApiProperty({ type: ProspectSummaryDto }) prospect: ProspectSummaryDto
  @ApiProperty({ type: LiveAccessDto }) live: LiveAccessDto
  @ApiProperty({ description: 'Duración máxima de la llamada en minutos' }) maxCallMinutes: number
}

export class EvaluateSimulationResponseDto {
  @ApiProperty({ type: SessionDto }) session: SessionDto
  @ApiProperty({ type: SimulationDto }) simulation: SimulationDto
}

export class CoachTipDto {
  @ApiProperty() tip: string
}

export class ExtractedProfileDto {
  @ApiProperty() name: string
  @ApiProperty() role: string
  @ApiProperty() company: string
  @ApiProperty({ enum: ['female', 'male', 'unknown'] }) gender: string
}

export class ScenarioDto {
  @ApiProperty() prospectName: string
  @ApiProperty() productName: string
  @ApiProperty() scenarioTheme: string
  @ApiProperty() context: string
  @ApiProperty() prospect: string
}
