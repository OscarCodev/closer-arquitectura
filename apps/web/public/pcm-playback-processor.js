/**
 * PCM Playback Processor — AudioWorklet
 * Receives Float32 PCM chunks from the main thread (Gemini model audio at 24kHz)
 * and plays them back through the speakers with minimal latency.
 */
class PcmPlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._queue = []
    this._offset = 0
    this._level = 0
    this._postEvery = 6
    this._framesUntilPost = this._postEvery

    this.port.onmessage = (e) => {
      if (e.data.clear) {
        this._queue = []
        this._offset = 0
        this._level = 0
        this._framesUntilPost = 0
        this.port.postMessage({ outputLevel: 0 })
        return
      }
      if (e.data.pcmData) {
        this._queue.push(new Float32Array(e.data.pcmData))
      }
    }
  }

  process(inputs, outputs) {
    const output = outputs[0]
    if (!output || !output[0]) return true

    const channel = output[0]
    let written = 0

    while (written < channel.length && this._queue.length > 0) {
      const chunk = this._queue[0]
      const available = chunk.length - this._offset
      const needed = channel.length - written

      if (available <= needed) {
        channel.set(chunk.subarray(this._offset), written)
        written += available
        this._queue.shift()
        this._offset = 0
      } else {
        channel.set(chunk.subarray(this._offset, this._offset + needed), written)
        this._offset += needed
        written = channel.length
      }
    }

    // Guarantee silence on the unwritten tail of this render quantum.
    if (written < channel.length) {
      channel.fill(0, written)
    }

    // RMS on rendered output (what user actually hears), with light smoothing.
    let sq = 0
    for (let i = 0; i < channel.length; i++) {
      const s = channel[i]
      sq += s * s
    }
    const rms = Math.sqrt(sq / channel.length)
    const target = Math.min(1, rms * 5.2)
    const coeff = target >= this._level ? 0.62 : 0.2
    this._level += (target - this._level) * coeff

    this._framesUntilPost -= 1
    if (this._framesUntilPost <= 0) {
      this._framesUntilPost = this._postEvery
      this.port.postMessage({ outputLevel: this._level })
    }

    return true
  }
}

registerProcessor('pcm-playback-processor', PcmPlaybackProcessor)
