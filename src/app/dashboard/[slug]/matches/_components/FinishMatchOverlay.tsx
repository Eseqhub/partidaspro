import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faImage } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { DraftResult } from '@/core/services/DraftService';
import { buildResultMessage, openWhatsApp } from '@/core/services/ShareService';
import { generateResultImage, shareResultImage } from '@/core/services/resultImage';

interface Props {
  homeTeamName: string;
  awayTeamName: string;
  homeColor: string;
  awayColor: string;
  score: { home: number; away: number };
  draftResult: DraftResult;
  mvpPlayerId: string | null;
  computeScorers: () => { name: string; team: 'home' | 'away'; goals: number }[];
  onWinner: (winner: 'home' | 'away') => void;
  onTieBreak: () => void;
}

export function FinishMatchOverlay({
  homeTeamName, awayTeamName, homeColor, awayColor,
  score, draftResult, mvpPlayerId,
  computeScorers, onWinner, onTieBreak,
}: Props) {
  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-lg p-8 rounded-3xl border-primary/20 text-center">
        <h2 className="text-xl font-black text-white uppercase tracking-widest mb-8 italic">
          Partida Encerrada! Quem venceu?
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => onWinner('home')}
            className="py-5 bg-primary text-black font-black uppercase tracking-widest rounded-xl"
          >
            {homeTeamName || 'TIME A'} GANHOU
          </button>
          <button
            onClick={onTieBreak}
            className="py-4 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black uppercase tracking-widest rounded-xl"
          >
            EMPATE — DESEMPATAR
          </button>
          <button
            onClick={() => onWinner('away')}
            className="py-5 bg-primary text-black font-black uppercase tracking-widest rounded-xl"
          >
            {awayTeamName || 'TIME B'} GANHOU
          </button>
        </div>

        <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/30 mt-5 mb-2">
          Compartilhar Resultado
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              const sc = computeScorers();
              openWhatsApp(buildResultMessage(
                homeTeamName || 'Time A', awayTeamName || 'Time B',
                score.home, score.away, sc,
              ));
            }}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase tracking-[0.15em] text-[10px]"
            style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366' }}
          >
            <FontAwesomeIcon icon={faWhatsapp} /> Texto
          </button>
          <button
            onClick={async () => {
              try {
                const mvp = mvpPlayerId
                  ? [...draftResult.homeTeam, ...draftResult.awayTeam].find(p => p.id === mvpPlayerId)?.name
                  : undefined;
                const blob = await generateResultImage({
                  homeName: homeTeamName || 'Time A',
                  awayName: awayTeamName || 'Time B',
                  homeColor,
                  awayColor,
                  homeScore: score.home,
                  awayScore: score.away,
                  scorers: computeScorers(),
                  mvpName: mvp,
                });
                await shareResultImage(blob, `${homeTeamName || 'Time A'} ${score.home} x ${score.away} ${awayTeamName || 'Time B'}`);
              } catch (e: any) {
                alert('Erro ao gerar imagem: ' + (e?.message ?? ''));
              }
            }}
            className="flex items-center justify-center gap-2 py-3 rounded-xl font-black uppercase tracking-[0.15em] text-[10px]"
            style={{ background: 'rgba(0,180,255,0.12)', border: '1px solid rgba(0,180,255,0.3)', color: '#00b4ff' }}
          >
            <FontAwesomeIcon icon={faImage} /> Imagem
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
