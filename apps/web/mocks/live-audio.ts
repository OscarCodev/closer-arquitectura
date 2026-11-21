/**
 * MOCK — sustituye a la sesión de voz en vivo con Gemini.
 *
 * Misma interfaz pública que la clase real (connect, startConversation,
 * toggleMute, disconnect…), pero no usa micrófono ni red: reproduce un
 * guion de conversación y anima los niveles de audio para que la pantalla
 * de simulación se vea "viva".
 */

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export interface GeminiLiveCallbacks {
  onStatusChange: (status: ConnectionStatus) => void
  onAudioLevel: (level: number) => void
  onModelAudioLevel: (level: number) => void
  onTranscript: (role: 'user' | 'model', text: string, finished?: boolean) => void
  onError: (error: string) => void
  onInterrupted: () => void
}

const SCRIPT: Array<{ role: 'user' | 'model'; text: string }> = [
  { role: 'model', text: 'Hola, ¿qué tal? Tengo unos minutos, cuéntame de qué se trata.' },
  { role: 'user', text: 'Hola, gracias por tu tiempo. Quería entender cómo gestionan hoy su proceso comercial.' },
  { role: 'model', text: 'Pues usamos hojas de cálculo y la verdad es que se nos escapan bastantes oportunidades.' },
  { role: 'user', text: '¿Tienen una idea de cuántas oportunidades pierden al mes por eso?' },
  { role: 'model', text: 'No lo tenemos medido, pero diría que bastantes. ¿Y esto cuánto costaría?' },
  { role: 'user', text: 'Depende del tamaño del equipo. Antes de hablar de precio, ¿quién más participa en la decisión?' },
  { role: 'model', text: 'Lo decido yo con mi director financiero. Él es bastante exigente con el retorno.' },
  { role: 'user', text: 'Tiene sentido. ¿Te parece si agendamos una demo con él el jueves?' },
  { role: 'model', text: 'Podría ser, mándame una propuesta y lo vemos.' },
]

export class GeminiLiveAudio {
  private status: ConnectionStatus = 'disconnected'
  private isMuted = false
  private started = false
  private stepIndex = 0
  private timers: ReturnType<typeof setTimeout>[] = []
  private levelInterval: ReturnType<typeof setInterval> | null = null

  constructor(
    private callbacks: GeminiLiveCallbacks,
    _systemPrompt?: string,
    _token?: string,
    _voiceName?: string,
  ) {}

  async connect() {
    this.setStatus('connecting')
    await new Promise((resolve) => this.schedule(resolve, 900))
    this.setStatus('connected')
  }

  startConversation() {
    if (this.started || this.status !== 'connected') return
    this.started = true
    this.schedule(() => this.playNextLine(), 600)
  }

  hasConversationStarted(): boolean {
    return this.started
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted
    if (this.isMuted) this.callbacks.onAudioLevel(0)
    return this.isMuted
  }

  disconnect() {
    this.timers.forEach(clearTimeout)
    this.timers = []
    this.stopLevels()
    this.callbacks.onModelAudioLevel(0)
    this.callbacks.onAudioLevel(0)
    this.started = false
    this.setStatus('disconnected')
  }

  private playNextLine() {
    if (this.status !== 'connected') return
    const line = SCRIPT[this.stepIndex % SCRIPT.length]

    // Si el micrófono está silenciado, el "usuario" espera a reactivarlo.
    if (line.role === 'user' && this.isMuted) {
      this.schedule(() => this.playNextLine(), 500)
      return
    }

    this.stepIndex += 1
    const durationMs = Math.min(6000, 1500 + line.text.length * 45)
    const setLevel = line.role === 'model' ? this.callbacks.onModelAudioLevel : this.callbacks.onAudioLevel

    this.startLevels(setLevel)
    this.callbacks.onTranscript(line.role, line.text, true)

    this.schedule(() => {
      this.stopLevels()
      setLevel(0)
      // Pausa más larga tras hablar la IA: es el momento en que se puede pedir "Consejo".
      this.schedule(() => this.playNextLine(), line.role === 'model' ? 4500 : 1200)
    }, durationMs)
  }

  private startLevels(setLevel: (level: number) => void) {
    this.stopLevels()
    this.levelInterval = setInterval(() => setLevel(0.15 + Math.random() * 0.5), 120)
  }

  private stopLevels() {
    if (this.levelInterval) clearInterval(this.levelInterval)
    this.levelInterval = null
  }

  private schedule(fn: (value?: unknown) => void, ms: number) {
    this.timers.push(setTimeout(fn, ms))
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status
    this.callbacks.onStatusChange(status)
  }
}
