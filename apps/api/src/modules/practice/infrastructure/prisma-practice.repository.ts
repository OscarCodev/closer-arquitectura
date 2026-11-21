import { Injectable } from '@nestjs/common'
import type { Prisma, PracticeSession, Simulation } from '@prisma/client'
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service'
import type { PracticeRepositoryPort } from '../application/ports'
import type { PracticeSessionRecord, SessionWithSimulations, SimulationRecord } from '../domain/practice-session'
import { normalizeSelections } from '../domain/prospect-persona'
import type { EvaluationResult, PracticeScenario } from '../domain/types'

/** Solo los intentos evaluados aparecen en el historial. */
const COMPLETED_ONLY = { where: { status: 'COMPLETED' as const }, orderBy: { createdAt: 'asc' as const } }

@Injectable()
export class PrismaPracticeRepository implements PracticeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listSessions(userId: string, limit: number): Promise<SessionWithSimulations[]> {
    // Usa el índice (user_id, updated_at desc). Las sesiones sin intentos evaluados no se muestran.
    const rows = await this.prisma.practiceSession.findMany({
      where: { userId, simulations: { some: { status: 'COMPLETED' } } },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: { simulations: COMPLETED_ONLY },
    })
    return rows.map((row) => ({ ...toSession(row), simulations: row.simulations.map(toSimulation) }))
  }

  async findSession(userId: string, sessionId: string): Promise<SessionWithSimulations | null> {
    const row = await this.prisma.practiceSession.findFirst({
      where: { id: sessionId, userId },
      include: { simulations: COMPLETED_ONLY },
    })
    return row ? { ...toSession(row), simulations: row.simulations.map(toSimulation) } : null
  }

  async createSession(userId: string, data: { name: string; voiceName: string; scenario: PracticeScenario }) {
    const row = await this.prisma.practiceSession.create({
      data: {
        userId,
        name: data.name,
        voiceName: data.voiceName,
        prospect: data.scenario.prospect,
        context: data.scenario.context,
        prospectName: data.scenario.prospectName || null,
        prospectRole: data.scenario.prospectRole || null,
        prospectCompany: data.scenario.prospectCompany || null,
        advancedSelections: data.scenario.advancedSelections,
      },
    })
    return toSession(row)
  }

  async renameSession(userId: string, sessionId: string, name: string) {
    const { count } = await this.prisma.practiceSession.updateMany({
      where: { id: sessionId, userId },
      data: { name, nameIsAuto: false },
    })
    return count > 0
  }

  async deleteSession(userId: string, sessionId: string) {
    const { count } = await this.prisma.practiceSession.deleteMany({ where: { id: sessionId, userId } })
    return count > 0
  }

  async createSimulation(userId: string, sessionId: string): Promise<SimulationRecord> {
    return toSimulation(await this.prisma.simulation.create({ data: { userId, sessionId } }))
  }

  async findSimulation(userId: string, simulationId: string) {
    const row = await this.prisma.simulation.findFirst({ where: { id: simulationId, userId }, include: { session: true } })
    return row ? { ...toSimulation(row), session: toSession(row.session) } : null
  }

  async claimForEvaluation(simulationId: string, expectedStatus: SimulationRecord['status'], expectedChangedAt: Date) {
    // Compare-and-set: si dos peticiones llegan a la vez, solo una cambia la fila.
    const { count } = await this.prisma.simulation.updateMany({
      where: { id: simulationId, status: expectedStatus, statusChangedAt: expectedChangedAt },
      data: { status: 'EVALUATING', statusChangedAt: new Date(), failureReason: null },
    })
    return count === 1
  }

  async completeSimulation(simulationId: string, durationSeconds: number, result: EvaluationResult) {
    // Transacción en lote (no interactiva): las tres escrituras se envían juntas, sin idas y vueltas que
    // mantengan una conexión ocupada. La versión interactiva vencía (5 s) bajo carga (hallazgo de k6).
    const ofThisSimulation = { simulations: { some: { id: simulationId } } }
    const now = new Date()
    await this.prisma.$transaction([
      this.prisma.simulation.update({
        where: { id: simulationId },
        data: {
          status: 'COMPLETED',
          statusChangedAt: now,
          evaluatedAt: now,
          durationSeconds,
          score: result.metrics.score,
          metrics: json(result.metrics),
          conversation: json(result.conversation),
          analysis: json(result.analysis),
          transcript: result.transcript,
        },
      }),
      // Si el nombre de la sesión era automático, toma el título sugerido…
      this.prisma.practiceSession.updateMany({
        where: { ...ofThisSimulation, nameIsAuto: true },
        data: { name: result.suggestedTitle.slice(0, 120), nameIsAuto: false },
      }),
      // …y en cualquier caso la sesión sube al inicio del historial.
      this.prisma.practiceSession.updateMany({ where: ofThisSimulation, data: { updatedAt: now } }),
    ])
  }

  async failSimulation(simulationId: string, durationSeconds: number, reason: string) {
    await this.prisma.simulation.update({
      where: { id: simulationId },
      data: { status: 'FAILED', statusChangedAt: new Date(), durationSeconds, failureReason: reason.slice(0, 300) },
    })
  }
}

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function toSession(row: PracticeSession): PracticeSessionRecord {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    nameIsAuto: row.nameIsAuto,
    voiceName: row.voiceName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    scenario: {
      context: row.context,
      prospect: row.prospect,
      prospectName: row.prospectName ?? '',
      prospectRole: row.prospectRole ?? '',
      prospectCompany: row.prospectCompany ?? '',
      advancedSelections: normalizeSelections(row.advancedSelections as Record<string, string>),
    },
  }
}

function toSimulation(row: Simulation): SimulationRecord {
  const hasResult = row.status === 'COMPLETED' && row.metrics && row.conversation && row.analysis
  return {
    id: row.id,
    sessionId: row.sessionId,
    userId: row.userId,
    status: row.status,
    durationSeconds: row.durationSeconds,
    failureReason: row.failureReason,
    statusChangedAt: row.statusChangedAt,
    createdAt: row.createdAt,
    result: hasResult
      ? {
          metrics: row.metrics as EvaluationResult['metrics'],
          conversation: row.conversation as EvaluationResult['conversation'],
          analysis: row.analysis as EvaluationResult['analysis'],
          transcript: row.transcript ?? '',
        }
      : null,
  }
}
