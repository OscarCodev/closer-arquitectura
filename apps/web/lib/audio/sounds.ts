/**
 * Closer UI sounds — Web Audio synthesis.
 *
 * Design philosophy (MacBook-level quality):
 *  ─ Start:  Full G-major chord hits simultaneously, piano-style transient,
 *            long natural decay across octaves. One moment, full presence.
 *  ─ End:    Single FM-synthesized bell/bowl tone. Crystal ring, long tail.
 *  ─ Error:  Soft percussive knock + a brief note that falls a semitone.
 *
 * Shared techniques:
 *  • Convolution reverb (synthetic IR) for spatial depth
 *  • DynamicsCompressor on master bus
 *  • Per-voice: 3-way chorus (+0, +7, −7 cents) for width
 *  • Filter envelope: bright transient → warm tail
 */

let _ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (typeof window === 'undefined') throw new Error('requires browser')
  if (!_ctx || _ctx.state === 'closed') _ctx = new AudioContext()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

// ─── Reverb ───────────────────────────────────────────────────
// Soft room reverb. decayTime = tail length, density controls diffusion.
let _reverbCache: ConvolverNode | null = null
function getReverb(ctx: AudioContext): ConvolverNode {
  if (_reverbCache) return _reverbCache
  const rate = ctx.sampleRate
  const len = Math.floor(rate * 1.8)
  const ir = ctx.createBuffer(2, len, rate)
  for (let ch = 0; ch < 2; ch++) {
    const buf = ir.getChannelData(ch)
    for (let i = 0; i < len; i++) {
      const t = i / rate
      // Stereo width: right channel slightly offset
      const jitter = ch === 0 ? 1.0 : 0.96
      buf[i] = (Math.random() * 2 - 1) * jitter * Math.exp(-t * 3.2)
    }
  }
  const conv = ctx.createConvolver()
  conv.buffer = ir
  _reverbCache = conv
  return conv
}

// ─── Master Bus ───────────────────────────────────────────────
function buildBus(ctx: AudioContext, masterGain: number, dryWet = 0.26): GainNode {
  const t = ctx.currentTime
  const input = ctx.createGain()
  input.gain.setValueAtTime(masterGain, t)

  const dry = ctx.createGain()
  dry.gain.setValueAtTime(1 - dryWet * 0.6, t)

  const wet = ctx.createGain()
  wet.gain.setValueAtTime(dryWet, t)

  const comp = ctx.createDynamicsCompressor()
  comp.threshold.setValueAtTime(-16, t)
  comp.knee.setValueAtTime(10, t)
  comp.ratio.setValueAtTime(4, t)
  comp.attack.setValueAtTime(0.002, t)
  comp.release.setValueAtTime(0.15, t)

  const reverb = getReverb(ctx)

  input.connect(dry)
  input.connect(wet)
  wet.connect(reverb)
  dry.connect(comp)
  reverb.connect(comp)
  comp.connect(ctx.destination)

  return input
}

// ─── Piano voice ─────────────────────────────────────────────
// MacBook-style: sharp attack (< 3ms), purely exponential decay.
// Higher notes decay faster than lower ones — exactly like a piano.
interface PianoOpts {
  freq: number
  start: number        // absolute AudioContext time
  decayTime: number    // how long until silent
  gain?: number
  wave?: OscillatorType
  detune?: number
}

function pianoVoice(ctx: AudioContext, dest: AudioNode, o: PianoOpts) {
  const { freq, start, decayTime, gain = 0.18, wave = 'sine', detune = 0 } = o

  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  const filt = ctx.createBiquadFilter()

  osc.type = wave
  osc.frequency.setValueAtTime(freq, start)
  if (detune) osc.detune.setValueAtTime(detune, start)

  // Bright attack, closes warm (filter follows decay curve)
  filt.type = 'lowpass'
  filt.frequency.setValueAtTime(6000, start)
  filt.frequency.exponentialRampToValueAtTime(900, start + decayTime * 0.6)
  filt.Q.setValueAtTime(0.5, start)

  // Piano envelope: instantaneous attack + pure exponential decay
  env.gain.setValueAtTime(0.0001, start)
  env.gain.exponentialRampToValueAtTime(gain, start + 0.003)   // 3ms attack
  env.gain.exponentialRampToValueAtTime(0.0001, start + decayTime)

  osc.connect(filt)
  filt.connect(env)
  env.connect(dest)
  osc.start(start)
  osc.stop(start + decayTime + 0.1)
}

// 3-voice chorus around a piano note (gives warmth and stereo width)
function pianoNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  decayTime: number,
  gain = 0.18,
) {
  pianoVoice(ctx, dest, { freq, start, decayTime, gain, wave: 'sine' })
  pianoVoice(ctx, dest, { freq, start, decayTime, gain: gain * 0.22, wave: 'triangle', detune: 7 })
  pianoVoice(ctx, dest, { freq, start, decayTime, gain: gain * 0.22, wave: 'triangle', detune: -7 })
}


// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Session Start — "The Room Opens"
 *
 * Inspired by the MacBook startup chime: a full G-major chord across
 * four octaves hits simultaneously with a piano-style transient.
 * Lower notes sustain longer than higher ones, exactly like a piano.
 * One single moment — not an arpeggio.
 */
export function playSessionStart() {
  try {
    const ctx = getCtx()
    const t = ctx.currentTime
    const bus = buildBus(ctx, 0.68, 0.30)

    //  G major chord voiced across octaves:
    //  G2  D3  G3  B3  D4  G4
    //  Each note's decayTime decreases with pitch (piano physics).
    //  All hit simultaneously — ±5ms natural stagger (like finger press).
    const chord = [
      { freq:  98.00, dt: 0.000, decay: 1.10, gain: 0.12 }, // G2  — felt, not heard
      { freq: 146.83, dt: 0.004, decay: 0.95, gain: 0.14 }, // D3
      { freq: 196.00, dt: 0.008, decay: 0.85, gain: 0.17 }, // G3
      { freq: 246.94, dt: 0.012, decay: 0.72, gain: 0.19 }, // B3
      { freq: 293.66, dt: 0.016, decay: 0.58, gain: 0.18 }, // D4
      { freq: 392.00, dt: 0.020, decay: 0.44, gain: 0.15 }, // G4
    ]

    for (const n of chord) {
      pianoNote(ctx, bus, n.freq, t + n.dt, n.decay, n.gain)
    }

    // Shimmer: a very soft G5 with short decay — adds air above the chord
    pianoVoice(ctx, bus, { freq: 784.00, start: t + 0.010, decayTime: 0.28, gain: 0.04, wave: 'sine' })
  } catch { /* silent fail */ }
}

/**
 * Session End — "The Room Closes"
 *
 * Same G-major piano chord family as Start, but the energy flows
 * downward instead of upward:
 *  • Same simultaneous hit technique — recognizably the same "voice"
 *  • Gravity inverted: lower notes sustain longest, upper notes fade first
 *  • The chord is voiced denser in the low-mid register (G2–G3 dominant)
 *  • A single soft G2 rings last — like the room going quiet
 *
 * Psychologically: the same space that opened is now gently closing.
 */
export function playSessionEnd() {
  try {
    const ctx = getCtx()
    const t = ctx.currentTime
    const bus = buildBus(ctx, 0.65, 0.30)

    // Same G major notes as Start — but decay order is reversed:
    // higher notes decay faster (fade first), lower notes linger
    // Start had G4 as the shimmer; here G4 is the shortest, G2 the longest.
    const chord = [
      { freq:  98.00, dt: 0.000, decay: 1.20, gain: 0.15 }, // G2  — stays longest, anchors
      { freq: 146.83, dt: 0.004, decay: 1.00, gain: 0.17 }, // D3
      { freq: 196.00, dt: 0.008, decay: 0.80, gain: 0.18 }, // G3
      { freq: 246.94, dt: 0.012, decay: 0.55, gain: 0.16 }, // B3  — fades mid
      { freq: 293.66, dt: 0.016, decay: 0.36, gain: 0.13 }, // D4  — fades early
      { freq: 392.00, dt: 0.020, decay: 0.20, gain: 0.09 }, // G4  — just a brief tap
    ]

    for (const n of chord) {
      pianoNote(ctx, bus, n.freq, t + n.dt, n.decay, n.gain)
    }

    // A very quiet G1 sub-note — felt more than heard, grounds the ending
    pianoVoice(ctx, bus, { freq: 49.00, start: t, decayTime: 0.90, gain: 0.06, wave: 'sine' })
  } catch { /* silent fail */ }
}

/**
 * Error — "Wrong Note"
 *
 * Same piano-chord technique and timing as Start/End — same family.
 * But the chord is G minor (Bb instead of B natural).
 * The minor third clashes subtly with the G-major world established
 * by the other two sounds — the listener immediately senses "off".
 *
 *  • Two short hits (not one) — signals interruption, not completion
 *  • Sparse voicing (3 notes only, no shimmer) — feels reduced, incomplete
 *  • Shorter overall decay — doesn't linger like the others
 */
export function playError() {
  try {
    const ctx = getCtx()
    const t = ctx.currentTime
    const bus = buildBus(ctx, 0.60, 0.22)

    // First hit: G minor chord (G3, Bb3, D4) — the Bb signals "wrong"
    const hit1 = [
      { freq: 196.00, dt: 0.000, decay: 0.38, gain: 0.16 }, // G3
      { freq: 233.08, dt: 0.004, decay: 0.32, gain: 0.17 }, // Bb3 — the dissonant note
      { freq: 293.66, dt: 0.008, decay: 0.26, gain: 0.14 }, // D4
    ]
    for (const n of hit1) {
      pianoNote(ctx, bus, n.freq, t + n.dt, n.decay, n.gain)
    }

    // Second hit (80ms later): same chord but softer, shorter — like an echo
    // that confirms "yes, something went wrong"
    const hit2 = [
      { freq: 196.00, dt: 0.000, decay: 0.24, gain: 0.09 }, // G3
      { freq: 233.08, dt: 0.003, decay: 0.20, gain: 0.10 }, // Bb3
      { freq: 293.66, dt: 0.006, decay: 0.16, gain: 0.08 }, // D4
    ]
    for (const n of hit2) {
      pianoNote(ctx, bus, n.freq, t + 0.11 + n.dt, n.decay, n.gain)
    }
  } catch { /* silent fail */ }
}
