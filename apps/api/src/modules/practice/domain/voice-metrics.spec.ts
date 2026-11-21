import { buildVoiceMetrics, durationToSeconds, formatDuration, wordsIn } from './voice-metrics'

describe('voice-metrics (dominio)', () => {
  it('formatDuration / durationToSeconds son inversas', () => {
    expect(formatDuration(0)).toBe('00:00')
    expect(formatDuration(605)).toBe('10:05')
    expect(durationToSeconds('10:05')).toBe(605)
    expect(formatDuration(-4)).toBe('00:00')
  })

  it('wordsIn ignora espacios repetidos', () => {
    expect(wordsIn('  hola   qué  tal ')).toBe(3)
  })

  it('"este" y "pues" ya no cuentan como muletillas (observación del MVP)', () => {
    const metrics = buildVoiceMetrics([{ role: 'user', text: 'Este producto es bueno, pues ahorra tiempo' }], 30)
    expect(metrics.fillers.count).toBe(0)
  })

  it('cuenta muletillas reales solo en lo que dice el vendedor', () => {
    const metrics = buildVoiceMetrics(
      [
        { role: 'model', text: 'eh, o sea, no sé' },
        { role: 'user', text: 'Eh, o sea, digamos que eh sí' },
      ],
      30,
    )
    expect(metrics.fillers.count).toBe(4)
    expect(metrics.fillers.examples).toEqual(
      expect.arrayContaining([
        { text: 'eh', count: 2 },
        { text: 'o sea', count: 1 },
        { text: 'digamos', count: 1 },
      ]),
    )
  })

  it('no confunde muletillas dentro de otras palabras', () => {
    expect(buildVoiceMetrics([{ role: 'user', text: 'tipografía emocionante' }], 30).fillers.count).toBe(0)
  })

  it('calcula la proporción hablar/escuchar por palabras', () => {
    const metrics = buildVoiceMetrics(
      [
        { role: 'model', text: 'uno dos tres' },
        { role: 'user', text: 'uno' },
      ],
      30,
    )
    expect(metrics.talkListenRatio).toMatchObject({ talk: 25, listen: 75 })
  })

  it('usa los tiempos reales de habla del vendedor si están disponibles', () => {
    const words = Array.from({ length: 150 }, () => 'palabra').join(' ')
    const metrics = buildVoiceMetrics([{ role: 'user', text: words, startedAt: 0, endedAt: 60_000 }], 600)
    expect(metrics.speechRate.value).toBe(150)
  })

  it('sin palabras del vendedor el ritmo es 0', () => {
    expect(buildVoiceMetrics([{ role: 'model', text: 'hola' }], 30).speechRate.value).toBe(0)
  })
})
