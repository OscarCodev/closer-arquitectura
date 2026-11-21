import { assembleEvaluation, InvalidEvaluationError, type AiEvaluation } from './evaluation'
import { mergeTranscript } from './transcript'
import type { PracticeScenario } from './types'

const scenario: PracticeScenario = {
  context: 'Vendo FlowCRM',
  prospect: 'Lucía Fernández, Head of Sales',
  prospectName: 'Lucía Fernández',
  prospectRole: 'Head of Sales',
  prospectCompany: 'Nubia Retail',
  advancedSelections: { modo: 'Descubrimiento', tono: 'Analítico' },
}

const merged = mergeTranscript([
  { role: 'model', text: '¿Aló?' },
  { role: 'user', text: 'Hola Lucía, ¿cómo gestionan su pipeline?' },
  { role: 'model', text: 'Con hojas de cálculo.' },
  { role: 'user', text: 'Te doy descuento si firmas hoy.' },
  { role: 'model', text: 'Mmm, no sé.' },
  { role: 'user', text: '¿Agendamos una demo el jueves?' },
])

const aiTurn = (turn: number, evaluation: string) => ({ turn, evaluation, title: `T${turn}`, diagnostic: `D${turn}`, improvement: null })

const validAi = (overrides: Partial<AiEvaluation> = {}): AiEvaluation => ({
  suggestedTitle: 'Lucía: Descubrimiento de pipeline',
  turns: [aiTurn(1, 'good'), aiTurn(2, 'critical'), aiTurn(3, 'good')],
  skills: { values: [60, 70, 40, 35, 55], improvementMessage: 'Valida antes de responder' },
  ...overrides,
})

describe('assembleEvaluation (dominio)', () => {
  it('arma el resultado completo con puntaje calculado en el servidor (CA-05.1)', () => {
    const result = assembleEvaluation({ merged, durationSeconds: 95, scenario, ai: validAi() })
    expect(result.conversation.map((t) => t.evaluation)).toEqual(['good', 'critical', 'good'])
    expect(result.metrics).toMatchObject({ turns: 3, errors: 1, brillantes: 2, duration: '01:35' })
    expect(result.analysis.skills.weakest.label).toBe('Objeciones')
    expect(result.transcript).toContain('TÚ: Hola Lucía')
    expect(result.suggestedTitle).toBe('Lucía: Descubrimiento de pipeline')
  })

  it('empareja por número de turno, no por posición (CA-05.7)', () => {
    const ai = validAi({ turns: [aiTurn(3, 'good'), aiTurn(1, 'warning')] })
    const result = assembleEvaluation({ merged, durationSeconds: 60, scenario, ai })
    expect(result.conversation[0]).toMatchObject({ turn: 1, evaluation: 'warning' })
    expect(result.conversation[1]).toMatchObject({ turn: 2, evaluation: 'neutral', title: 'Sin evaluación' })
    expect(result.conversation[2]).toMatchObject({ turn: 3, evaluation: 'good' })
  })

  it('nunca inventa feedback: un turno omitido queda "Sin evaluación" (CA-05.7)', () => {
    const result = assembleEvaluation({ merged, durationSeconds: 60, scenario, ai: validAi({ turns: [aiTurn(1, 'good'), aiTurn(2, 'good')] }) })
    expect(result.conversation[2]).toMatchObject({ title: 'Sin evaluación', diagnostic: 'La IA no evaluó este turno.', improvement: null })
  })

  it('rechaza una evaluación que cubre menos de la mitad de los turnos (CA-05.5)', () => {
    expect(() => assembleEvaluation({ merged, durationSeconds: 60, scenario, ai: validAi({ turns: [aiTurn(1, 'good')] }) })).toThrow(
      InvalidEvaluationError,
    )
  })

  it('ignora tipos de evaluación desconocidos', () => {
    const ai = validAi({ turns: [aiTurn(1, 'excelente'), aiTurn(2, 'good'), aiTurn(3, 'good')] })
    expect(assembleEvaluation({ merged, durationSeconds: 60, scenario, ai }).conversation[0].title).toBe('Sin evaluación')
  })

  it('rechaza habilidades inválidas (CA-05.5)', () => {
    expect(() =>
      assembleEvaluation({ merged, durationSeconds: 60, scenario, ai: validAi({ skills: { values: [1, 2] } }) }),
    ).toThrow(InvalidEvaluationError)
  })

  it('rechaza una llamada sin intercambios (CA-05.6)', () => {
    expect(() => assembleEvaluation({ merged: [], durationSeconds: 5, scenario, ai: validAi() })).toThrow(InvalidEvaluationError)
  })

  it('reemplaza un título genérico de la IA por "Prospecto: tema" (CA-05.8)', () => {
    const result = assembleEvaluation({ merged, durationSeconds: 60, scenario, ai: validAi({ suggestedTitle: 'Simulación de ventas' }) })
    expect(result.suggestedTitle).toBe('Lucía: Objeción de precio')
  })
})
