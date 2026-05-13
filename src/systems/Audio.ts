export class Audio {
  private ac: AudioContext | null = null;

  init(): void {
    if (this.ac) return;
    const Ctor = window.AudioContext
      || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ac = new Ctor();
  }

  private blip(freq: number, dur = 0.05, type: OscillatorType = 'square', vol = 0.04): void {
    if (!this.ac) return;
    const o = this.ac.createOscillator();
    const g = this.ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.0001, this.ac.currentTime + dur);
    o.connect(g).connect(this.ac.destination);
    o.start();
    o.stop(this.ac.currentTime + dur);
  }

  shoot()  { this.blip(880, 0.05, 'square', 0.04); }
  hit()    { this.blip(140, 0.18, 'sawtooth', 0.08); }
  swing()  { this.blip(420, 0.04, 'triangle', 0.05); }
  pickup() { this.blip(660, 0.08, 'sine', 0.05); }
  dash()   { this.blip(220, 0.10, 'triangle', 0.05); }
  door()   { this.blip(1200, 0.20, 'sine', 0.06); }

  death(): void {
    this.blip(120, 0.40, 'sawtooth', 0.10);
    setTimeout(() => this.blip(80, 0.4, 'sawtooth', 0.08), 100);
  }
}
