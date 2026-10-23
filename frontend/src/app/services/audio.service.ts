import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    this.initAudio();
  }

  private initAudio(): void {
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
  }

  private resumeContext(): void {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  // Sonido de clic táctil en teclado/botones
  playKeypadBeep(): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    this.resumeContext();
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.08);
  }

  // Sonido de enigma resuelto con éxito
  playSuccessChime(): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    this.resumeContext();
    const now = this.audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);
      gain.gain.setValueAtTime(0.12, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.3);
      osc.connect(gain);
      gain.connect(this.audioCtx!.destination);
      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.3);
    });
  }

  // Sonido de error o código incorrecto
  playErrorBuzz(): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    this.resumeContext();
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.25);
  }

  // Sonido de compuerta abierta / Nivel completado
  playDoorUnlock(): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    this.resumeContext();
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.4);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Fanfarria de Victoria Final
  playVictoryFanfare(): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    this.resumeContext();
    const now = this.audioCtx.currentTime;
    const melody = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.15 },
      { f: 1046.50, d: 0.45 }
    ];
    let offset = 0;
    melody.forEach(note => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + offset);
      gain.gain.setValueAtTime(0.18, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + note.d);
      osc.connect(gain);
      gain.connect(this.audioCtx!.destination);
      osc.start(now + offset);
      osc.stop(now + offset + note.d);
      offset += note.d * 0.9;
    });
  }

  // Sonido al colocar pieza de rompecabezas
  playPiecePlaced(): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    this.resumeContext();
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Sonido en Tic-Tac-Toe (X vs O)
  playTicTacToeMove(isPlayerX: boolean): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    this.resumeContext();
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = isPlayerX ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(isPlayerX ? 660 : 440, now);
    osc.frequency.exponentialRampToValueAtTime(isPlayerX ? 880 : 330, now + 0.12);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Sonidos de Piedra, Papel o Tijera (RPS)
  playRpsPick(): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    this.resumeContext();
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.09);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playRpsClash(): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    this.resumeContext();
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playRpsWin(): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    this.resumeContext();
    const now = this.audioCtx.currentTime;
    [587.33, 739.99, 880.00].forEach((freq, idx) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.14, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(this.audioCtx!.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  }

  playChallengeSuccess(): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    this.resumeContext();
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientInterval: any = null;
  private currentAmbientTrack: string = '';

  stopAmbient(): void {
    this.currentAmbientTrack = '';
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    if (this.ambientOsc && this.audioCtx) {
      try {
        this.ambientGain?.gain.setTargetAtTime(0.001, this.audioCtx.currentTime, 0.25);
        setTimeout(() => {
          this.ambientOsc?.stop();
          this.ambientOsc?.disconnect();
          this.ambientOsc = null;
          this.ambientGain = null;
        }, 300);
      } catch (e) {
        this.ambientOsc = null;
      }
    }
  }

  playScenarioAmbient(scenarioId: string): void {
    if (this.currentAmbientTrack === scenarioId) return;
    if (scenarioId.includes('reactor')) {
      this.playReactorAmbient();
    } else if (scenarioId.includes('temple')) {
      this.playTempleAmbient();
    } else if (scenarioId.includes('space')) {
      this.playSpaceAmbient();
    }
  }

  // Banda Sonora Gratuita Procedural: Reactor Nuclear (Cyberpunk / Synthwave)
  playReactorAmbient(): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    this.stopAmbient();
    this.resumeContext();
    this.currentAmbientTrack = 'reactor';

    // Drone bajo pulsante
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, this.audioCtx.currentTime); // A1
    gain.gain.setValueAtTime(0.02, this.audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();

    this.ambientOsc = osc;
    this.ambientGain = gain;

    // Arpegio cyberpunk rítmico (A menor pentatónico: A2, C3, D3, E3, G3)
    const arpNotes = [110, 130.81, 146.83, 164.81, 196.00, 220, 196.00, 164.81];
    let noteIdx = 0;

    this.ambientInterval = setInterval(() => {
      if (!this.audioCtx || !this.soundEnabled || this.currentAmbientTrack !== 'reactor') return;
      const t = this.audioCtx.currentTime;
      const noteOsc = this.audioCtx.createOscillator();
      const noteGain = this.audioCtx.createGain();
      noteOsc.type = 'triangle';
      noteOsc.frequency.setValueAtTime(arpNotes[noteIdx % arpNotes.length], t);
      noteGain.gain.setValueAtTime(0.015, t);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      noteOsc.connect(noteGain);
      noteGain.connect(this.audioCtx.destination);
      noteOsc.start(t);
      noteOsc.stop(t + 0.24);
      noteIdx++;
    }, 240);
  }

  // Banda Sonora Gratuita Procedural: Templo Ancestral (Místico / Campana Tibetana)
  playTempleAmbient(): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    this.stopAmbient();
    this.resumeContext();
    this.currentAmbientTrack = 'temple';

    // Drone armónico de meditación
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(146.83, this.audioCtx.currentTime); // D3
    gain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();

    this.ambientOsc = osc;
    this.ambientGain = gain;

    // Campanas zen ancestrales (Escala Frigia: D, Eb, G, A, C)
    const templeNotes = [293.66, 311.13, 392.00, 440.00, 523.25, 587.33];

    this.ambientInterval = setInterval(() => {
      if (!this.audioCtx || !this.soundEnabled || this.currentAmbientTrack !== 'temple') return;
      if (Math.random() > 0.4) {
        const t = this.audioCtx.currentTime;
        const bellOsc = this.audioCtx.createOscillator();
        const bellGain = this.audioCtx.createGain();
        const freq = templeNotes[Math.floor(Math.random() * templeNotes.length)];
        bellOsc.type = 'sine';
        bellOsc.frequency.setValueAtTime(freq, t);
        bellGain.gain.setValueAtTime(0.02, t);
        bellGain.gain.exponentialRampToValueAtTime(0.00001, t + 1.8);
        bellOsc.connect(bellGain);
        bellGain.connect(this.audioCtx.destination);
        bellOsc.start(t);
        bellOsc.stop(t + 1.8);
      }
    }, 1400);
  }

  // Banda Sonora Gratuita Procedural: Estación Espacial (Sintetizador Cósmico / Lydian Starlight)
  playSpaceAmbient(): void {
    if (!this.soundEnabled || !this.audioCtx) return;
    this.stopAmbient();
    this.resumeContext();
    this.currentAmbientTrack = 'space';

    // Drone celestial espacial
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(77.78, this.audioCtx.currentTime); // Eb2
    gain.gain.setValueAtTime(0.025, this.audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();

    this.ambientOsc = osc;
    this.ambientGain = gain;

    // Destellos estelares (Eb Lydian: Eb4, G4, A4, Bb4, D5)
    const spaceNotes = [311.13, 392.00, 440.00, 466.16, 587.33, 622.25];

    this.ambientInterval = setInterval(() => {
      if (!this.audioCtx || !this.soundEnabled || this.currentAmbientTrack !== 'space') return;
      const t = this.audioCtx.currentTime;
      const starOsc = this.audioCtx.createOscillator();
      const starGain = this.audioCtx.createGain();
      const note = spaceNotes[Math.floor(Math.random() * spaceNotes.length)];
      starOsc.type = 'sine';
      starOsc.frequency.setValueAtTime(note, t);
      starGain.gain.setValueAtTime(0.015, t);
      starGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      starOsc.connect(starGain);
      starGain.connect(this.audioCtx.destination);
      starOsc.start(t);
      starOsc.stop(t + 0.8);
    }, 900);
  }
}
