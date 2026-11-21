import { Module } from '@nestjs/common'
import { AppConfig } from '../../shared/infrastructure/config/app-config.service'
import { CoachTipUseCase, ExtractProfileUseCase, GenerateScenarioUseCase } from './application/ai-assist.use-cases'
import { EvaluateSimulationUseCase } from './application/evaluate-simulation.use-case'
import { CONVERSATION_AI, LIVE_VOICE, PRACTICE_REPOSITORY } from './application/ports'
import { DeleteSessionUseCase, GetSessionUseCase, ListSessionsUseCase, RenameSessionUseCase } from './application/sessions.use-cases'
import { StartSimulationUseCase } from './application/start-simulation.use-case'
import { FakeConversationAiAdapter, FakeLiveVoiceAdapter } from './infrastructure/ai/fake-ai.adapters'
import { GeminiConversationAiAdapter } from './infrastructure/ai/gemini-conversation-ai.adapter'
import { GeminiLiveVoiceAdapter } from './infrastructure/ai/gemini-live-voice.adapter'
import { PrismaPracticeRepository } from './infrastructure/prisma-practice.repository'
import { AssistController } from './presentation/assist.controller'
import { SessionsController } from './presentation/sessions.controller'
import { SimulationsController } from './presentation/simulations.controller'

/**
 * Práctica: sesiones, simulaciones (llamadas), evaluación y asistente de IA.
 * El proveedor de IA se elige por configuración (AI_PROVIDER): Gemini o un adaptador simulado.
 */
@Module({
  controllers: [SessionsController, SimulationsController, AssistController],
  providers: [
    ListSessionsUseCase,
    GetSessionUseCase,
    RenameSessionUseCase,
    DeleteSessionUseCase,
    StartSimulationUseCase,
    EvaluateSimulationUseCase,
    CoachTipUseCase,
    ExtractProfileUseCase,
    GenerateScenarioUseCase,
    { provide: PRACTICE_REPOSITORY, useClass: PrismaPracticeRepository },
    {
      provide: CONVERSATION_AI,
      inject: [AppConfig],
      useFactory: (config: AppConfig) =>
        config.get('AI_PROVIDER') === 'gemini' ? new GeminiConversationAiAdapter(config) : new FakeConversationAiAdapter(),
    },
    {
      provide: LIVE_VOICE,
      inject: [AppConfig],
      useFactory: (config: AppConfig) =>
        config.get('AI_PROVIDER') === 'gemini' ? new GeminiLiveVoiceAdapter(config) : new FakeLiveVoiceAdapter(),
    },
  ],
})
export class PracticeModule {}
