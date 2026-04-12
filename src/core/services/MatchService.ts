import { Match, MatchEvent } from '../entities/match';
import { MatchRepository } from '@/infra/repositories/MatchRepository';

export class MatchService {
  constructor(private matchRepo: MatchRepository) {}

  async startMatch(matchId: string) {
    // Registra o início real da partida para o cronômetro ser preciso no realtime
    return this.matchRepo.update(matchId, { 
      status: 'Em curso',
      date: new Date().toISOString() // Atualiza para o momento real do início
    });
  }

  async pauseMatch(matchId: string, currentTimer: number) {
    return this.matchRepo.update(matchId, { 
      status: 'Pausada',
      timer_seconds: currentTimer
    });
  }

  async addEvent(matchId: string, event: Omit<MatchEvent, 'id' | 'created_at'>) {
    // Ao adicionar um gol, atualiza o placar da partida automaticamente
    if (event.type === 'Gol') {
      const match = await this.matchRepo.update(matchId, {}); // Pega estado atual
      // Lógica de incremento de placar...
    }
    // Salva o evento...
  }

  calculateCurrentTimer(match: Match): number {
    if (match.status !== 'Em curso') return match.timer_seconds;
    
    const startTime = new Date(match.date).getTime();
    const now = new Date().getTime();
    const elapsedSinceStart = Math.floor((now - startTime) / 1000);
    
    return match.timer_seconds + elapsedSinceStart;
  }
}
