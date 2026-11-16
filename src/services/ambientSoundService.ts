// Procedural Web Audio Ambient Sound Generator (No external files needed, 100% offline)
class AmbientSoundGenerator {
  private audioCtx: AudioContext | null = null;
  private currentMode: 'rain' | 'waves' | 'cafe' | 'off' = 'off';
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;

  private initCtx() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playRain() {
    this.stop();
    this.initCtx();
    if (!this.audioCtx) return;

    // Pink noise buffer for rain
    const bufferSize = this.audioCtx.sampleRate * 2;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Low-pass filter for cozy muffled rain
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.audioCtx.currentTime);

    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);

    noise.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);

    noise.start();
    this.noiseNode = noise;
    this.currentMode = 'rain';
  }

  playWaves() {
    this.stop();
    this.initCtx();
    if (!this.audioCtx) return;

    const bufferSize = this.audioCtx.sampleRate * 3;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.05;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, this.audioCtx.currentTime);
    filter.Q.setValueAtTime(1.5, this.audioCtx.currentTime);

    this.gainNode = this.audioCtx.createGain();
    this.gainNode.gain.setValueAtTime(0.25, this.audioCtx.currentTime);

    noise.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);

    noise.start();
    this.noiseNode = noise;
    this.currentMode = 'waves';
  }

  stop() {
    if (this.noiseNode) {
      try {
        (this.noiseNode as any).stop();
        this.noiseNode.disconnect();
      } catch {}
      this.noiseNode = null;
    }
    this.currentMode = 'off';
  }

  getMode() {
    return this.currentMode;
  }
}

export const ambientSound = new AmbientSoundGenerator();
