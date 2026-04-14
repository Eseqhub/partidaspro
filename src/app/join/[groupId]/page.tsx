'use client';

import React, { useState } from 'react';
import { GlassCard } from '@/presentation/components/ui/GlassCard';
import { Button } from '@/presentation/components/ui/Button';
import { GroupRepository } from '@/infra/repositories/GroupRepository';
import { useRouter, useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faShieldHalved } from '@fortawesome/free-solid-svg-icons';

export default function JoinGroupPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  const groupRepo = new GroupRepository();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isValid = await groupRepo.verifyPassword(groupId, password);
      if (isValid) {
        // Garantir acesso temporário na sessão
        sessionStorage.setItem(`access_${groupId}`, 'true');
        router.push(`/register/${groupId}`);
      } else {
        setError('Senha incorreta. Verifique com o organizador.');
      }
    } catch (err) {
      setError('Erro ao verificar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <FontAwesomeIcon icon={faShieldHalved} className="text-primary text-2xl" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Acesso Restrito</h1>
            <p className="text-white/40 text-sm mt-2">Esta partida é privada. Insira a senha fornecida pelo organizador.</p>
        </div>

        <GlassCard className="p-8">
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-primary mb-2">
                Senha de Convite
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faLock} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="DIGITE A SENHA..."
                  className="w-full bg-black/40 border border-white/10 rounded-none py-4 pl-12 pr-4 text-white placeholder:text-white/10 focus:border-primary/50 transition-colors"
                  required
                />
              </div>
              {error && <p className="text-accent text-[10px] mt-2 font-bold uppercase">{error}</p>}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-4 text-slate-950 font-black uppercase tracking-widest text-sm"
              disabled={loading}
            >
              {loading ? 'VERIFICANDO...' : 'ENTRAR NA PARTIDA'}
            </Button>
          </form>
        </GlassCard>

        <p className="text-center mt-8 text-[10px] text-white/20 font-bold uppercase tracking-[0.2em]">
          Partidas Pro &copy; 2026
        </p>
      </div>
    </div>
  );
}
