/**
 * AudioService - Responsável por gerar os avisos sonoros da partida.
 * Utiliza Web Audio API para evitar dependência de arquivos externos.
 */
export class AudioService {
  private audioContext: AudioContext | null = null;

  private initContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Toca um bip curto
   */
  playBip(frequency: number = 880, duration: number = 0.1) {
    this.initContext();
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Alarme de fim de partida (sequência de bips mais longos)
   */
  playEndAlarm() {
    this.playBip(440, 0.5);
    setTimeout(() => this.playBip(440, 0.5), 600);
    setTimeout(() => this.playBip(880, 1.0), 1200);
  }
}
