/**
 * Web Audio API procedural sound synthesizer for Afterfall
 * Generates campfire crackle, atmospheric wind, night crickets, and UI clicks
 * without relying on external audio files.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.volume = 0.5;
    this.masterGain = null;
    
    // Wind nodes
    this.windGain = null;
    this.windFilter = null;
    
    // Fire nodes
    this.fireGain = null;
    this.fireTimer = null;
    
    // Crickets nodes
    this.cricketGain = null;
    this.cricketTimer = null;
    
    this.isNight = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      
      this.setupWind();
      this.setupFire();
      this.setupCrickets();
      
      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.init();
    this.resume();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(
        this.isMuted ? 0 : this.volume,
        this.ctx.currentTime + 0.3
      );
    }
    return !this.isMuted;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (!this.isMuted && this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  setTimeOfDay(isNight) {
    this.isNight = isNight;
    if (this.cricketGain && this.ctx) {
      this.cricketGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.cricketGain.gain.linearRampToValueAtTime(
        isNight ? 0.25 : 0.0,
        this.ctx.currentTime + 1.5
      );
    }
  }

  setupWind() {
    if (!this.ctx) return;
    // Generate pink/white noise buffer
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.setValueAtTime(260, this.ctx.currentTime);

    // LFO for swaying wind breeze
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.windFilter.frequency);
    lfo.start();

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    whiteNoise.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    whiteNoise.start();
  }

  setupFire() {
    if (!this.ctx) return;
    this.fireGain = this.ctx.createGain();
    this.fireGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.fireGain.connect(this.masterGain);

    // Soft low rumble for campfire body
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.1;
    }

    const fireNoise = this.ctx.createBufferSource();
    fireNoise.buffer = noiseBuffer;
    fireNoise.loop = true;

    const fireFilter = this.ctx.createBiquadFilter();
    fireFilter.type = 'bandpass';
    fireFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    fireFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    fireNoise.connect(fireFilter);
    fireFilter.connect(this.fireGain);
    fireNoise.start();

    // Random pops and crackles
    const schedulePops = () => {
      if (!this.isMuted && this.ctx && this.fireGain) {
        this.playPop();
      }
      const nextDelay = 80 + Math.random() * 320;
      this.fireTimer = setTimeout(schedulePops, nextDelay);
    };
    schedulePops();
  }

  playPop() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = Math.random() > 0.5 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(800 + Math.random() * 1200, now);
    osc.frequency.exponentialRampToValueAtTime(100 + Math.random() * 200, now + 0.04);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(600, now);

    const amp = 0.03 + Math.random() * 0.07;
    gain.gain.setValueAtTime(amp, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.fireGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  setupCrickets() {
    if (!this.ctx) return;
    this.cricketGain = this.ctx.createGain();
    this.cricketGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.cricketGain.connect(this.masterGain);

    const chirp = () => {
      if (!this.isMuted && this.isNight && this.ctx) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4200 + Math.random() * 600, now);
        
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        
        osc.connect(gain);
        gain.connect(this.cricketGain);
        osc.start(now);
        osc.stop(now + 0.13);
      }
      this.cricketTimer = setTimeout(chirp, 400 + Math.random() * 900);
    };
    chirp();
  }

  playUiClick() {
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.03);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      // ignore
    }
  }

  dispose() {
    if (this.fireTimer) clearTimeout(this.fireTimer);
    if (this.cricketTimer) clearTimeout(this.cricketTimer);
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch (e) {}
    }
  }
}

export const audioManager = new AudioManager();
export default audioManager;
