/**
 * Procedural Web Audio API sound synthesizer
 * Provides relaxing ambient drone music and satisfying ASMR sound effects
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private isMusicPlaying = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.35;
      this.musicGain.connect(this.masterGain);

      this.isInitialized = true;
      this.startAmbientMusic();
    } catch (e) {
      console.warn('AudioContext initialization deferred or unavailable', e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.isInitialized) {
      this.init();
    }
  }

  public setVolumes(master: number, sfx: number, music: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.masterGain) this.masterGain.gain.setValueAtTime(master, now);
    if (this.sfxGain) this.sfxGain.gain.setValueAtTime(sfx, now);
    if (this.musicGain) this.musicGain.gain.setValueAtTime(music, now);
  }

  /**
   * Relaxing, meditative ambient soundscape (432Hz harmonic chord & warm slow LFO)
   */
  public startAmbientMusic() {
    if (!this.ctx || !this.musicGain || this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    // Frequencies for a soothing, uplifting Pentatonic / Lydian chord (A, C#, E, G#, B)
    const baseFreqs = [108, 162, 216, 324, 432, 648];

    baseFreqs.forEach((freq, idx) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Warm low-pass filter
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800 + idx * 100, this.ctx.currentTime);

      // Subtle slow detune / drift for organic warmth
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.08 + idx * 0.03, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(2.5, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start();

      gain.gain.setValueAtTime(0.06 / (idx + 1), this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start();
      this.ambientOscillators.push(osc);
    });
  }

  public stopAmbientMusic() {
    this.ambientOscillators.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    this.ambientOscillators = [];
    this.isMusicPlaying = false;
  }

  /**
   * Slicing whoosh + blade sweep
   */
  public playSlashSound(power: string) {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Noise burst for swoosh
    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(300, now + 0.16);
    noiseFilter.Q.setValueAtTime(3.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.28, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.18);

    // Tonal blade resonance
    const tone = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    tone.type = 'sine';

    let baseFreq = 540;
    if (power === 'fire') baseFreq = 380;
    if (power === 'frost') baseFreq = 880;
    if (power === 'lightning') baseFreq = 720;
    if (power === 'void') baseFreq = 220;

    tone.frequency.setValueAtTime(baseFreq * 1.5, now);
    tone.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.15);

    toneGain.gain.setValueAtTime(0.2, now);
    toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    tone.connect(toneGain);
    toneGain.connect(this.sfxGain);

    tone.start(now);
    tone.stop(now + 0.17);
  }

  public playShootSound(power: string) {
    this.playSlashSound(power);
  }

  /**
   * Extremely satisfying hit/slice impact with ASMR chime
   */
  public playHitSound(power: string, combo = 1) {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Scale chime pitch with combo (pentatonic scale)
    const pentatonicRatios = [1, 1.125, 1.25, 1.5, 1.667, 2, 2.25, 2.5];
    const pitchRatio = pentatonicRatios[Math.min(combo, pentatonicRatios.length - 1)];

    // Crystal Bell chime (sine + overtone)
    const chime1 = this.ctx.createOscillator();
    const chime2 = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();

    chime1.type = 'sine';
    chime2.type = 'triangle';

    let fundamental = 660 * pitchRatio;
    if (power === 'void') fundamental = 330 * pitchRatio;
    if (power === 'frost') fundamental = 880 * pitchRatio;
    if (power === 'fire') fundamental = 440 * pitchRatio;

    chime1.frequency.setValueAtTime(fundamental, now);
    chime2.frequency.setValueAtTime(fundamental * 2.756, now); // Bell harmonic

    chimeGain.gain.setValueAtTime(0.35, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    chime1.connect(chimeGain);
    chime2.connect(chimeGain);
    chimeGain.connect(this.sfxGain);

    chime1.start(now);
    chime2.start(now);
    chime1.stop(now + 0.46);
    chime2.stop(now + 0.46);

    // Deep relaxing sub-bass impact
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, now);
    sub.frequency.exponentialRampToValueAtTime(45, now + 0.2);

    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);

    sub.start(now);
    sub.stop(now + 0.23);

    // Power specific extra accent
    if (power === 'frost') {
      this.playGlassShatter();
    } else if (power === 'lightning') {
      this.playElectricSparks();
    } else if (power === 'void') {
      this.playVoidDrop();
    }
  }

  private playGlassShatter() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    [1200, 1600, 2200, 3100].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + Math.random() * 200, now + idx * 0.02);
      gain.gain.setValueAtTime(0.12, now + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.02 + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.02);
      osc.stop(now + idx * 0.02 + 0.21);
    });
  }

  private playElectricSparks() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.15);

    const dist = this.ctx.createWaveShaper();
    const n_samples = 256;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + 10) * x * 20 * (Math.PI / 180)) / (Math.PI + 10 * Math.abs(x));
    }
    dist.curve = curve;

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(dist);
    dist.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  private playVoidDrop() {
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.4);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.43);
  }

  /**
   * Ultimate Power execution sound (majestic chord + bass wave)
   */
  public playUltimateSound(power: string) {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Heavenly chord
    const chord = [261.63, 329.63, 392.0, 523.25, 659.25];
    chord.forEach((freq) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 1.25);
    });

    // Sub-bass sweep
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(180, now);
    sub.frequency.exponentialRampToValueAtTime(32, now + 0.8);
    subGain.gain.setValueAtTime(0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(now);
    sub.stop(now + 0.9);
  }

  /**
   * Switch power sound (crisp subtle tick + elemental tone)
   */
  public playSwitchSound(power: string) {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freqs: Record<string, number> = {
      laser: 880,
      fire: 480,
      frost: 1040,
      lightning: 780,
      void: 360,
    };

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freqs[power] || 600, now);
    osc.frequency.exponentialRampToValueAtTime((freqs[power] || 600) * 1.5, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /**
   * Dash sound (smooth vacuum air rush)
   */
  public playDashSound() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  /**
   * Player hurt sound (impact thud + high frequency drop)
   */
  public playPlayerHurtSound() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  /**
   * Boss telegraphed attack warning sound
   */
  public playBossTelegraphSound() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * Boss shield sound (harmonic crystalline hum)
   */
  public playBossShieldSound() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;

    [520, 780, 1040].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.46);
    });
  }

  /**
   * Victory fanfare (uplifting pentatonic triad arpeggio)
   */
  public playVictoryFanfare() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0.001, now + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.65);
    });
  }

  /**
   * Defeat sound (low descending tone)
   */
  public playDefeatSound() {
    if (!this.ctx || !this.sfxGain) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.8);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.9);
  }
}

export const soundManager = new SoundSynthesizer();
