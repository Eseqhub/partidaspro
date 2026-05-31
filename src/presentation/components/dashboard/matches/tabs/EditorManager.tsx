import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';

interface EditorManagerProps {
  editorInput: string;
  setEditorInput: (val: string) => void;
  editors: any[];
  setEditors: (editors: any[]) => void;
  groupId: string | null;
  groupRepo: any;
  supabase: any;
}

export const EditorManager: React.FC<EditorManagerProps> = ({
  editorInput, setEditorInput, editors, setEditors, groupId, groupRepo, supabase,
}) => (
  <GlassCard className="p-6 rounded-2xl border-white/5 bg-white/[0.02]">
    <h3 className="text-white font-black uppercase tracking-widest text-[10px] mb-6">
      Gestão de Editores (Delegar)
    </h3>
    <div className="space-y-4">
      {/* Adicionar editor */}
      <div className="flex gap-2">
        <input
          type="email"
          value={editorInput}
          onChange={e => setEditorInput(e.target.value)}
          placeholder="E-MAIL..."
          className="flex-1 bg-black/40 border border-white/10 p-3 text-white text-[10px] font-black tracking-widest outline-none rounded-lg"
        />
        <Button
          onClick={async () => {
            if (editorInput && groupId) {
              await groupRepo.addEditor(groupId, editorInput.toLowerCase());
              setEditorInput('');
              const { data: roles } = await supabase
                .from('group_roles').select('*').eq('group_id', groupId);
              setEditors(roles || []);
            }
          }}
          className="bg-primary text-black px-6 font-black uppercase text-[10px] rounded-lg border-none"
        >
          ADD
        </Button>
      </div>

      {/* Lista de editores */}
      <div className="grid grid-cols-1 gap-2">
        {editors.map((ed, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-lg">
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest truncate">
              {ed.user_email}
            </span>
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
);
