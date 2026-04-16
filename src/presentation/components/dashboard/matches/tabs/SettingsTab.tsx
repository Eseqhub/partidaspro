import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapPin, faLocationArrow, faClock, faRotateRight, faTimes } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { GameMode, SportType } from '@/core/entities/match';

interface SettingsTabProps {
  config: any;
  setConfig: (cfg: any) => void;
  handleSaveConfig: () => void;
  loading: boolean;
  userRole: string;
  editorInput: string;
  setEditorInput: (val: string) => void;
  editors: any[];
  setEditors: (editors: any[]) => void;
  groupId: string | null;
  groupRepo: any;
  supabase: any;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  setConfig,
  handleSaveConfig,
  loading,
  userRole,
  editorInput,
  setEditorInput,
  editors,
  setEditors,
  groupId,
  groupRepo,
  supabase,
}) => {
  return (
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlassCard className="p-6 rounded-2xl border-white/5 bg-white/[0.02]">
        <h3 className="text-white font-black uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faMapPin} className="text-primary" /> Localização & Estatuto
        </h3>

        <div className="space-y-6">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 flex items-center justify-between">
              <span>Local / Arena</span>
              {config.location && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.location)}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-primary hover:text-white transition-colors flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faLocationArrow} /> GOOGLE MAPS
                </a>
              )}
            </label>
            <input 
              type="text" 
              value={config.location}
              onChange={(e) => setConfig({...config, location: e.target.value})}
              placeholder="NOME DO LOCAL..."
              className="w-full bg-black/40 border border-white/10 p-3 text-white text-[10px] font-black tracking-widest focus:border-primary/40 outline-none rounded-lg"
            />
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-primary mb-2 block italic">Regras do Grupo (Visível para todos)</label>
            <textarea 
              value={config.rules_text}
              onChange={(e) => setConfig({...config, rules_text: e.target.value})}
              className="w-full bg-black/40 border border-white/10 p-4 text-white font-mono text-[10px] h-32 outline-none focus:border-primary/40 rounded-xl"
              placeholder="EX: MENSALISTAS R$ 50,00..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 block">Início</label>
              <input 
                type="time" 
                value={config.sessionStartTime}
                onChange={(e) => setConfig({...config, sessionStartTime: e.target.value})}
                className="w-full bg-black/40 border border-white/10 p-3 text-white text-[10px] font-black focus:border-primary/40 outline-none rounded-lg"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 block">Término</label>
              <input 
                type="time" 
                value={config.sessionEndTime}
                onChange={(e) => setConfig({...config, sessionEndTime: e.target.value})}
                className="w-full bg-black/40 border border-white/10 p-3 text-white text-[10px] font-black focus:border-primary/40 outline-none rounded-lg"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 rounded-2xl border-white/5 bg-white/[0.02]">
        <h3 className="text-white font-black uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faRotateRight} className="text-primary" /> Regras da Partida
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 block">Esporte</label>
              <select 
                value={config.sport_type}
                onChange={(e) => setConfig({...config, sport_type: e.target.value as SportType})}
                className="w-full bg-black/40 border border-white/10 p-3 text-white text-[9px] font-black uppercase tracking-widest outline-none rounded-lg"
              >
                <option value="Society" className="bg-slate-900">SOCIETY (7x7)</option>
                <option value="Futsal" className="bg-slate-900">FUTSAL (5x5)</option>
                <option value="Campo" className="bg-slate-900">CAMPO (11x11)</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 block">Modo</label>
              <select 
                value={config.game_mode}
                onChange={(e) => setConfig({...config, game_mode: e.target.value as GameMode})}
                className="w-full bg-black/40 border border-white/10 p-3 text-white text-[9px] font-black uppercase tracking-widest outline-none rounded-lg"
              >
                <option value="Rachão" className="bg-slate-900">RACHÃO</option>
                <option value="Revezamento" className="bg-slate-900">REVEZAMENTO</option>
                <option value="Dois ou Dez" className="bg-slate-900">2 OU 10</option>
                <option value="Vira-Acaba" className="bg-slate-900">VIRA-ACABA</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 block">Tempo Jogo (Min)</label>
            <input 
              type="number" 
              value={config.duration}
              onChange={(e) => setConfig({...config, duration: parseInt(e.target.value)})}
              className="w-full bg-black/40 border border-white/10 p-3 text-white text-[10px] font-black rounded-lg"
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2 block">Acréscimos (Min)</label>
            <input 
              type="number" 
              value={config.stoppage}
              onChange={(e) => setConfig({...config, stoppage: parseInt(e.target.value)})}
              className="w-full bg-black/40 border border-white/10 p-3 text-white text-[10px] font-black rounded-lg"
            />
          </div>
        </div>
      </GlassCard>

      {userRole === 'owner' && (
        <GlassCard className="p-6 rounded-2xl border-white/5 bg-white/[0.02]">
          <h3 className="text-white font-black uppercase tracking-widest text-[10px] mb-6">
            Gestão de Editores (Delegar)
          </h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input 
                type="email" 
                value={editorInput}
                onChange={(e) => setEditorInput(e.target.value)}
                placeholder="E-MAIL..."
                className="flex-1 bg-black/40 border border-white/10 p-3 text-white text-[10px] font-black tracking-widest outline-none rounded-lg"
              />
              <Button 
                onClick={async () => {
                  if (editorInput && groupId) {
                    await groupRepo.addEditor(groupId, editorInput.toLowerCase());
                    setEditorInput('');
                    const { data: roles } = await supabase.from('group_roles').select('*').eq('group_id', groupId);
                    setEditors(roles || []);
                  }
                }}
                className="bg-primary text-black px-6 font-black uppercase text-[10px] rounded-lg border-none"
              >
                ADD
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {editors.map((ed, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
                  <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest truncate">{ed.user_email}</span>
                  <button 
                    onClick={async () => {
                      await supabase.from('group_roles').delete().eq('id', ed.id);
                      setEditors(editors.filter(e => e.id !== ed.id));
                    }}
                    className="text-red-500/40 hover:text-red-500 transition-colors p-1"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      )}
      
      <div className="flex justify-end pt-4">
        <Button 
          variant="primary" 
          className="w-full sm:w-auto px-12 py-4 uppercase font-black tracking-[0.2em] text-[10px] bg-gradient-to-r from-primary to-green-500 text-black border-none shadow-lg rounded-xl transition-all hover:scale-105"
          onClick={handleSaveConfig}
          disabled={loading}
        >
          {loading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
        </Button>
      </div>
    </div>
  );
};
