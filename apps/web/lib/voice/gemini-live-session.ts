/**
 * Llamada de voz en tiempo real con Gemini Live.
 *
 * El navegador habla directo con Google por WebSocket (baja latencia) usando un token efímero
 * emitido por nuestro backend. El token trae bloqueados el modelo, la voz y el prompt del prospecto,
 * así que el navegador no conoce la API key ni puede cambiar el personaje.
 *
 * Audio:
 *  Entrada: micrófono → AudioWorklet (PCM 16 bit, 16 kHz) → lotes de ~40 ms → sendRealtimeInput
 *  Salida:  PCM 24 kHz del modelo → AudioWorklet de reproducción → parlantes
 */
import { GoogleGenAI, Modality, type LiveServerMessage, type Session } from '@google/genai'
import type { LiveAccess } from '@/lib/api/closer-api'
import type { ConnectionStatus, VoiceCallbacks, VoiceSession } from './voice-session'

/** ~40 ms de audio a 16 kHz y 16 bit: reduce de ~125 a ~25 mensajes por segundo (observación del MVP). */
const SEND_BATCH_BYTES = 1280
const CONNECT_TIMEOUT_MS = 15_000
/** Disparador inicial: el prospecto "contesta el teléfono" según su instrucción de sistema. */
const CALL_START_TRIGGER = '(Suena el teléfono: el vendedor te está llamando. Contesta.)'

export class GeminiLiveSession implements VoiceSession {
  private session: Session | null = null
  private micStream: MediaStream | null = null
  private inputCtx: AudioContext | null = null
  private outputCtx: AudioContext | null = null
  private captureNode: AudioWorkletNode | null = null
  private playbackNode: AudioWorkletNode | null = null
  private analyser: AnalyserNode | null = null
  private pendingAudio: Uint8Array[] = []
  private pendingBytes = 0
  private isMuted = false
  private status: ConnectionStatus = 'disconnected'
  private audioLevelRAF: number | null = null
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null
  private modelAudioEnvelope = 0
  private greetingSent = false
  private conversationRequested = false

  constructor(
    private readonly callbacks: VoiceCallbacks,
    private readonly access: LiveAccess,
  ) {}

  async connect() {
    if (this.status !== 'disconnected') return
    this.setStatus('connecting')

    try {
      const ai = new GoogleGenAI({ apiKey: this.access.token, httpOptions: { apiVersion: 'v1alpha' } })
      this.connectionTimeout = setTimeout(() => {
        if (this.status === 'connecting') {
          this.callbacks.onError('Tiempo de espera agotado al conectar.')
          this.disconnect()
        }
      }, CONNECT_TIMEOUT_MS)

      this.session = await ai.live.connect({
        model: this.access.model,
        // La configuración real (prompt, voz, transcripción) viene bloqueada en el token.
        config: { responseModalities: [Modality.AUDIO] },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (this.status === 'disconnected') return
            this.clearConnectTimeout()
            this.handleMessage(message)
          },
          onerror: (event: ErrorEvent) => {
            this.clearConnectTimeout()
            this.callbacks.onError(`Error de conexión con Gemini: ${event.message || 'desconocido'}`)
          },
          onclose: (event: CloseEvent) => {
            this.clearConnectTimeout()
            if (this.status === 'disconnected') return
            if (event.code === 1008 || event.code === 1003) {
              this.callbacks.onError('Gemini rechazó la conexión. Inicia la práctica de nuevo.')
            } else if (event.code !== 1000 && event.code !== 1001) {
              this.callbacks.onError(`La llamada se cortó (${event.code}${event.reason ? `: ${event.reason}` : ''}).`)
            }
            this.cleanup()
            this.setStatus('disconnected')
          },
        },
      })

      if (this.status === 'disconnected') {
        this.session.close()
        this.session = null
      }
    } catch (error) {
      this.callbacks.onError(`No se pudo conectar con Gemini: ${(error as Error).message}`)
      this.cleanup()
      this.setStatus('disconnected')
    }
  }

  /**
   * La página de simulación lo pide cuando ya está montada (no durante la pantalla de carga).
   * Si el audio aún no está listo, queda pendiente y se envía al terminar `startAudio`.
   */
  startConversation() {
    this.conversationRequested = true
    if (this.greetingSent || !this.session || !this.playbackNode) return
    try {
      this.session.sendClientContent({ turns: [{ role: 'user', parts: [{ text: CALL_START_TRIGGER }] }], turnComplete: true })
      this.greetingSent = true
    } catch {
      // se reintenta cuando la página de simulación vuelva a llamar
    }
  }

  hasConversationStarted() {
    return this.greetingSent
  }

  toggleMute() {
    this.isMuted = !this.isMuted
    this.micStream?.getAudioTracks().forEach((track) => (track.enabled = !this.isMuted))
    return this.isMuted
  }

  disconnect() {
    this.cleanup()
    this.setStatus('disconnected')
  }

  private handleMessage(message: LiveServerMessage) {
    if (message.setupComplete) {
      this.setStatus('connected')
      void this.startAudio()
      return
    }

    const content = message.serverContent
    if (!content) return

    if (content.interrupted) {
      // Barge-in: el vendedor interrumpió, se vacía la cola de reproducción al instante.
      this.callbacks.onInterrupted()
      this.playbackNode?.port.postMessage({ clear: true })
      return
    }

    for (const part of content.modelTurn?.parts ?? []) {
      if (part.inlineData?.data) this.playAudioChunk(part.inlineData.data)
    }
    if (content.outputTranscription?.text) {
      this.callbacks.onTranscript('model', content.outputTranscription.text, content.outputTranscription.finished)
    }
    if (content.inputTranscription?.text) {
      this.callbacks.onTranscript('user', content.inputTranscription.text, content.inputTranscription.finished)
    }
  }

  private async startAudio() {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })

      this.inputCtx = new AudioContext({ sampleRate: 16000 })
      if (this.inputCtx.state === 'suspended') await this.inputCtx.resume()
      await this.inputCtx.audioWorklet.addModule('/pcm-processor.js')
      const source = this.inputCtx.createMediaStreamSource(this.micStream)
      this.analyser = this.inputCtx.createAnalyser()
      this.analyser.fftSize = 256
      source.connect(this.analyser)
      this.captureNode = new AudioWorkletNode(this.inputCtx, 'pcm-capture-processor')
      this.analyser.connect(this.captureNode)
      this.captureNode.connect(this.inputCtx.destination)
      this.captureNode.port.onmessage = (event) => {
        if (event.data.pcmData && !this.isMuted) this.queueAudio(new Uint8Array(event.data.pcmData))
      }

      this.outputCtx = new AudioContext({ sampleRate: 24000 })
      if (this.outputCtx.state === 'suspended') await this.outputCtx.resume()
      await this.outputCtx.audioWorklet.addModule('/pcm-playback-processor.js')
      this.playbackNode = new AudioWorkletNode(this.outputCtx, 'pcm-playback-processor')
      this.playbackNode.connect(this.outputCtx.destination)
      this.playbackNode.port.onmessage = (event) => {
        const level = event.data?.outputLevel
        if (typeof level !== 'number') return
        const clamped = Math.max(0, Math.min(1, level))
        this.modelAudioEnvelope += (clamped - this.modelAudioEnvelope) * (clamped >= this.modelAudioEnvelope ? 0.68 : 0.24)
        if (this.modelAudioEnvelope < 0.003) this.modelAudioEnvelope = 0
        this.callbacks.onModelAudioLevel(this.modelAudioEnvelope)
      }

      this.monitorInputLevel()
      if (this.conversationRequested) this.startConversation()
    } catch {
      this.callbacks.onError('No se pudo acceder al micrófono. Verifica los permisos del navegador.')
    }
  }

  private queueAudio(chunk: Uint8Array) {
    this.pendingAudio.push(chunk)
    this.pendingBytes += chunk.byteLength
    if (this.pendingBytes < SEND_BATCH_BYTES || !this.session) return

    const batch = new Uint8Array(this.pendingBytes)
    let offset = 0
    for (const part of this.pendingAudio) {
      batch.set(part, offset)
      offset += part.byteLength
    }
    this.pendingAudio = []
    this.pendingBytes = 0
    try {
      this.session.sendRealtimeInput({ audio: { data: toBase64(batch), mimeType: 'audio/pcm;rate=16000' } })
    } catch {
      // un lote perdido no corta la llamada
    }
  }

  private playAudioChunk(base64: string) {
    if (!this.playbackNode) return
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const int16 = new Int16Array(bytes.buffer)
    const float32 = new Float32Array(int16.length)
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768
    this.playbackNode.port.postMessage({ pcmData: float32.buffer }, [float32.buffer])
  }

  private monitorInputLevel() {
    if (!this.analyser) return
    const data = new Uint8Array(this.analyser.frequencyBinCount)
    const tick = () => {
      if (!this.analyser) return
      this.analyser.getByteTimeDomainData(data)
      let sum = 0
      for (const value of data) {
        const v = (value - 128) / 128
        sum += v * v
      }
      this.callbacks.onAudioLevel(Math.min(1, Math.sqrt(sum / data.length) * 3))
      this.audioLevelRAF = requestAnimationFrame(tick)
    }
    tick()
  }

  private clearConnectTimeout() {
    if (this.connectionTimeout) clearTimeout(this.connectionTimeout)
    this.connectionTimeout = null
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status
    this.callbacks.onStatusChange(status)
  }

  private cleanup() {
    this.clearConnectTimeout()
    if (this.audioLevelRAF) cancelAnimationFrame(this.audioLevelRAF)
    this.audioLevelRAF = null
    const safe = (fn: () => void) => {
      try {
        fn()
      } catch {
        // ignorar
      }
    }
    safe(() => this.session?.close())
    safe(() => this.captureNode?.disconnect())
    safe(() => this.playbackNode?.disconnect())
    safe(() => this.analyser?.disconnect())
    safe(() => void this.inputCtx?.close())
    safe(() => void this.outputCtx?.close())
    this.micStream?.getTracks().forEach((track) => track.stop())
    this.session = null
    this.captureNode = null
    this.playbackNode = null
    this.analyser = null
    this.inputCtx = null
    this.outputCtx = null
    this.micStream = null
    this.pendingAudio = []
    this.pendingBytes = 0
    this.modelAudioEnvelope = 0
    this.callbacks.onModelAudioLevel(0)
    this.greetingSent = false
    this.conversationRequested = false
    this.isMuted = false
  }
}

function toBase64(bytes: Uint8Array) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
  return btoa(binary)
}
