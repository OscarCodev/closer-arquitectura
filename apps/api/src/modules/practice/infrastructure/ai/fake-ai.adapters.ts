import { Injectable } from '@nestjs/common'
import type { ConversationAiPort, ExtractedProfile, GeneratedScenario, LiveSessionAccess, LiveVoicePort } from '../../application/ports'
import type { AiEvaluation } from '../../domain/evaluation'
import type { TurnPair } from '../../domain/transcript'

/**
 * Adaptadores deterministas, sin red ni costo. Se activan con AI_PROVIDER=fake:
 * desarrollo sin claves, pruebas automatizadas y pruebas de carga con k6.
 * Implementan los mismos puertos que Gemini (ADR-004: proveedores sustituibles).
 */

const SCENARIOS: GeneratedScenario[] = [
  {
    prospectName: 'Lucía Fernández',
    productName: 'FlowCRM',
    scenarioTheme: 'Discovery',
    context: 'Vendo FlowCRM, un CRM para equipos comerciales de 10 a 50 personas. Objetivo: conseguir una demo con la responsable de ventas.',
    prospect: 'Lucía Fernández, Head of Sales en Nubia Retail. Lleva 6 meses en el puesto, su equipo trabaja con hojas de cálculo y tiene presión por subir la conversión este trimestre.',
  },
  {
    prospectName: 'Martín Rojas',
    productName: 'PayLite',
    scenarioTheme: 'Objeciones de precio',
    context: 'Vendo PayLite, una pasarela de pagos con comisiones bajas para e-commerce. Objetivo: cerrar una prueba piloto de 30 días.',
    prospect: 'Martín Rojas, CFO en Andes Market. Muy analítico, desconfía de cambiar de proveedor y siempre pregunta por costos ocultos.',
  },
  {
    prospectName: 'Sofía Herrera',
    productName: 'TalentHub',
    scenarioTheme: 'Cierre',
    context: 'Vendo TalentHub, software de reclutamiento con IA. Ya hubo dos reuniones; objetivo: cerrar el contrato anual.',
    prospect: 'Sofía Herrera, Directora de RRHH en Grupo Ladera. Le gusta el producto pero su CEO pide justificar el retorno antes de firmar.',
  },
]

const FEMALE_NAMES = /^(luc[ií]a|sof[ií]a|ana|mar[ií]a|camila|valentina|andrea|carla|laura|paula|daniela)\b/i

@Injectable()
export class FakeConversationAiAdapter implements ConversationAiPort {
  private scenarioIndex = 0

  async extractProfile(prospectText: string): Promise<ExtractedProfile> {
    const name = prospectText.match(/^(\p{Lu}\p{Ll}+(?:\s\p{Lu}\p{Ll}+)?)/u)?.[1] ?? ''
    const roleCompany = prospectText.match(/,\s*([^,.]+?)\s+en\s+([^,.]+)/)
    return {
      name,
      role: roleCompany?.[1]?.trim() ?? '',
      company: roleCompany?.[2]?.trim() ?? '',
      gender: name ? (FEMALE_NAMES.test(name) ? 'female' : 'male') : 'unknown',
    }
  }

  async coachTip(): Promise<string> {
    return 'Valida lo que acaba de decir y pregunta por el impacto: "¿Cuánto les cuesta hoy ese problema al mes?"'
  }

  async generateScenario(): Promise<GeneratedScenario> {
    const scenario = SCENARIOS[this.scenarioIndex % SCENARIOS.length]
    this.scenarioIndex++
    return scenario
  }

  /** Evaluación determinista: depende solo del contenido, así las pruebas son reproducibles. */
  async evaluate(params: { turns: TurnPair[] }): Promise<AiEvaluation> {
    const turns = params.turns.map((pair) => {
      const text = pair.tu.toLowerCase()
      if (!pair.tu.trim()) {
        return { turn: pair.turn, evaluation: 'warning', title: 'Mejorable: sin respuesta', diagnostic: 'No respondiste a la intervención del prospecto.', improvement: 'Responde con una pregunta abierta para mantener la conversación.' }
      }
      if (text.includes('?') || text.includes('¿')) {
        return { turn: pair.turn, evaluation: 'good', title: 'Excelente: pregunta consultiva', diagnostic: `Preguntaste: "${pair.tu.slice(0, 80)}".`, improvement: null }
      }
      if (/precio|descuento|barato/.test(text)) {
        return { turn: pair.turn, evaluation: 'critical', title: 'Error crítico: precio antes de valor', diagnostic: 'Hablaste de precio sin haber construido valor.', improvement: 'Primero cuantifica el problema y luego conecta la inversión con ese resultado.' }
      }
      return { turn: pair.turn, evaluation: 'neutral', title: 'Neutro: respuesta funcional', diagnostic: 'La respuesta fue correcta pero no profundizó.', improvement: 'Cierra tu intervención con una pregunta de descubrimiento.' }
    })
    const good = turns.filter((t) => t.evaluation === 'good').length
    const base = Math.min(90, 45 + good * 8)
    return {
      suggestedTitle: '',
      turns,
      skills: { values: [base, base + 4, base - 10, base - 4, base - 8], improvementMessage: '' },
    }
  }
}

@Injectable()
export class FakeLiveVoiceAdapter implements LiveVoicePort {
  async createSessionAccess(params: { voiceName: string; maxSessionMinutes: number }): Promise<LiveSessionAccess> {
    return {
      provider: 'fake',
      token: 'fake-live-token',
      model: 'fake-voice',
      voiceName: params.voiceName,
      expiresAt: new Date(Date.now() + params.maxSessionMinutes * 60 * 1000).toISOString(),
    }
  }
}
