import { Button } from "@/presentation/components/ui/Button";
import { GlassCard } from "@/presentation/components/ui/GlassCard";
import { User, Calendar, MapPin, Trophy, Users, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-6 animate-fade-in">
            <ShieldCheck size={14} />
            KIT 2.0 PROTOCOL ACTIVE
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight uppercase">
            Gestão Suprema para sua <br />
            <span className="text-gradient font-black italic">Partida Pro</span>
          </h1>
          <p className="max-w-2xl text-lg text-white/60 mb-10">
            Organize times, controle presenças e acompanhe estatísticas de alto nível. 
            A plataforma definitiva para quem leva o esporte a sério.
          </p>
          <div className="flex items-center gap-4">
            <Button href="/signup" size="lg">Fundar meu Clube</Button>
            <Button variant="glass" size="lg">Conhecer o SaaS</Button>
          </div>
        </div>
      </section>

      {/* Stats/Quick Actions */}
      <section className="px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="p-8 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">Próximas Partidas</h3>
              <p className="text-sm text-white/50 mb-6">Confirme sua presença e veja quem vai pro jogo.</p>
              <Button href="/login" variant="outline" size="sm" className="w-full">Agendar Jogo</Button>
            </div>
          </GlassCard>

          <GlassCard className="p-8 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary">
              <Trophy size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 underline decoration-secondary/30 decoration-4 uppercase tracking-tighter">Ranking de Craques</h3>
              <p className="text-sm text-white/50 mb-6">Acompanhe gols, assistências e vitórias da galera.</p>
              <Button href="/login" variant="outline" size="sm" className="w-full border-secondary/50 text-secondary hover:bg-secondary/5 hover:border-secondary">Ver Analytics</Button>
            </div>
          </GlassCard>

          <GlassCard className="p-8 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">Seus Clubes</h3>
              <p className="text-sm text-white/50 mb-6">Gerencie múltiplos grupos de atletas sem esforço.</p>
              <Button href="/login" variant="outline" size="sm" className="w-full border-accent/50 text-accent hover:bg-accent/5 hover:border-accent">Explorar Central</Button>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Dashboard Preview Teaser */}
      <section className="px-6 py-20 bg-slate-900/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-12">
            <div className="flex-1">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 italic tracking-tighter uppercase">ESTAÇÃO DE COMANDO</h2>
              <p className="text-white/60 font-medium">Interface fluida projetada para facilitar a vida do organizador profissional.</p>
            </div>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-secondary animate-pulse [animation-delay:200ms]"></div>
              <div className="w-3 h-3 rounded-full bg-accent animate-pulse [animation-delay:400ms]"></div>
            </div>
          </div>
          
          <GlassCard className="aspect-[16/9] md:aspect-[21/9] p-2" hoverable={false}>
            <div className="w-full h-full rounded-xl bg-slate-950/50 border border-white/5 flex items-center justify-center relative overflow-hidden">
               {/* Decorative background grid */}
               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
               <div className="relative z-10 text-center">
                  <div className="text-4xl font-black text-white/10 mb-2 uppercase tracking-widest leading-none">Partidas Pro Console</div>
                  <p className="text-sm text-white/20 uppercase tracking-[0.4em]">Arquitetura SaaS & Padrão Kit 2.0</p>
               </div>
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
