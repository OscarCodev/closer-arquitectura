import { buildSkillRadar, clampPercent, computeMetrics, EVALUATION_POINTS, scoreConversation, SKILL_LABELS } from './scoring'
import type { ConversationTurn, SimulationAnalysis } from './types'
import { buildVoiceMetrics } from './voice-metrics'

const turn = (n: number, evaluation: ConversationTurn['evaluation']): ConversationTurn => ({
  turn: n,
  ia: 'pregunta',
  tu: 'respuesta',
  evaluation,
  title: 't',
  diagnostic: 'd',
  improvement: null,
})

describe('scoring (dominio)', () => {
  it('clampPercent acota a 0-100 y trata NaN como 0', () => {
    expect(clampPercent(150)).toBe(100)
    expect(clampPercent(-3)).toBe(0)
    expect(clampPercent(Number.NaN)).toBe(0)
    expect(clampPercent(72.6)).toBe(73)
  })

  describe('buildSkillRadar', () => {
    it('identifica la habilidad más fuerte y la más débil (CA-05.1)', () => {
      const radar = buildSkillRadar([40, 90, 55, 30, 60])!
      expect(radar.labels).toEqual(SKILL_LABELS)
      expect(radar.strongest).toEqual({ label: 'Descubrimiento', value: 90 })
      expect(radar.weakest).toEqual({ label: 'Objeciones', value: 30 })
      expect(radar.averageSuccessRate).toBe(55)
      expect(radar.improvementMessage).toMatch(/objeción/i)
    })

    it('respeta la recomendación de la IA si viene', () => {
      expect(buildSkillRadar([50, 50, 50, 50, 50], 'Practica el cierre')!.improvementMessage).toBe('Practica el cierre')
    })

    it.each([[[1, 2, 3]], [[1, 2, 3, 4, 'x']], [null], ['50,50,50,50,50']])('rechaza valores inválidos: %p', (values) => {
      expect(buildSkillRadar(values)).toBeNull()
    })
  })

  it('un solo error crítico no hunde el promedio a cero (observación del MVP)', () => {
    const score = scoreConversation([turn(1, 'critical'), turn(2, 'good'), turn(3, 'good')])
    expect(score).toBe(Math.round((EVALUATION_POINTS.critical + 2 * EVALUATION_POINTS.good) / 3))
    expect(score).toBeGreaterThan(60)
  })

  it('scoreConversation de una llamada sin turnos es 0', () => {
    expect(scoreConversation([])).toBe(0)
  })

  it('computeMetrics cuenta los tipos de turno y formatea la duración (CA-05.1)', () => {
    const conversation = [turn(1, 'critical'), turn(2, 'warning'), turn(3, 'good'), turn(4, 'neutral'), turn(5, 'good')]
    const analysis: SimulationAnalysis = {
      voice: buildVoiceMetrics([{ role: 'user', text: 'hola qué tal' }], 95),
      skills: buildSkillRadar([60, 60, 60, 60, 60])!,
    }
    const metrics = computeMetrics(conversation, analysis, 95)
    expect(metrics).toMatchObject({ duration: '01:35', turns: 5, errors: 1, mejorables: 1, brillantes: 2, neutros: 1 })
    expect(metrics.score).toBeGreaterThanOrEqual(0)
    expect(metrics.score).toBeLessThanOrEqual(100)
  })

  it('el puntaje es determinista: la misma entrada da el mismo resultado', () => {
    const conversation = [turn(1, 'good'), turn(2, 'warning')]
    const analysis: SimulationAnalysis = {
      voice: buildVoiceMetrics([{ role: 'user', text: 'uno dos tres' }], 60),
      skills: buildSkillRadar([70, 65, 50, 40, 55])!,
    }
    expect(computeMetrics(conversation, analysis, 60)).toEqual(computeMetrics(conversation, analysis, 60))
  })
})
