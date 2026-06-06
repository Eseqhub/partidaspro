'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown, faFutbol, faUsers, faStopwatch, faBell, faComments,
  faTableList, faWallet, faShieldHalved, faCircleQuestion, faTriangleExclamation,
  faMobileScreen, faArrowLeft, faFilePdf, faShareNodes,
} from '@fortawesome/free-solid-svg-icons';

interface QA { q: string; a: React.ReactNode; }
interface Section { id: string; title: string; icon: any; color: string; items: QA[]; }

const SECTIONS: Section[] = [
  {
    id: 'geral', title: 'O que é o Partidas Pro', icon: faCircleQuestion, color: '#ccff00',
    items: [
      {
        q: 'O que é o app e para que serve?',
        a: <>É um sistema completo para gerenciar peladas e clubes de futebol amador. Ele organiza
          presença, sorteia times equilibrados, controla o cronômetro e o placar ao vivo, registra
          gols e estatísticas (a súmula), gerencia as finanças do grupo e ainda transmite a partida
          em tempo real para todo mundo acompanhar.</>,
      },
      {
        q: 'Preciso instalar alguma coisa?',
        a: <>Não. Funciona direto no navegador (celular ou PC). Mas dá pra <b>instalar como app</b>:
          no celular, abra o site e use “Adicionar à tela inicial”. Aí ele abre em tela cheia,
          como um aplicativo de verdade — e as notificações funcionam melhor (obrigatório no iPhone).</>,
      },
      {
        q: 'Quanto custa? Meus dados ficam salvos?',
        a: <>Os dados das partidas (gols, craques, estatísticas, comentários) ficam guardados
          permanentemente. Histórico completo, sem prazo de expiração.</>,
      },
    ],
  },
  {
    id: 'papeis', title: 'Papéis: quem pode o quê', icon: faShieldHalved, color: '#00b4ff',
    items: [
      {
        q: 'Quais são os tipos de usuário?',
        a: <ul className="list-disc pl-4 space-y-1">
          <li><b>Organizador (admin)</b> — quem fundou o clube. Aprova entradas, gerencia o elenco,
            cria partidas, mexe nas finanças e nas configurações.</li>
          <li><b>Editor</b> — membro que o organizador delega para ajudar (registrar gols, aprovar
            entradas, editar atletas).</li>
          <li><b>Atleta / Torcedor</b> — vê o elenco, acompanha a partida ao vivo, comenta e recebe avisos.</li>
        </ul>,
      },
      {
        q: 'Como viro organizador de um clube?',
        a: <>Crie uma conta <b>sem usar link de convite</b> e funde seu clube. Quem cria a conta
          dessa forma já nasce como organizador do próprio grupo.</>,
      },
      {
        q: 'Como dou poderes de edição a um amigo?',
        a: <>Nas configurações do clube, em “Editores”, adicione o e-mail da pessoa. Ela passa a
          poder gerenciar a partida e aprovar entradas junto com você.</>,
      },
    ],
  },
  {
    id: 'entrada', title: 'Entrar no grupo / cadastrar atletas', icon: faUsers, color: '#22c55e',
    items: [
      {
        q: 'Como convido vários jogadores de uma vez?',
        a: <>No painel do clube, copie o <b>link de convite</b>. Ele é <b>permanente</b> — o mesmo
          link serve para quantos amigos quiser, sempre. Não precisa gerar um novo a cada vez.</>,
      },
      {
        q: 'O que acontece quando alguém abre o link?',
        a: <>A pessoa lê as regras/estatuto (se houver), preenche a ficha de atleta (nome, foto,
          posição, telefone, e-mail) e envia. A ficha vira uma <b>solicitação pendente</b> —
          ela só entra no elenco depois que um admin aprovar.</>,
      },
      {
        q: 'Como aprovo (ou recuso) uma entrada?',
        a: <>Quando alguém solicita, os admins recebem uma <b>notificação “Fulano quer entrar”</b>.
          No painel do clube aparece o bloco <b>“Solicitações de Entrada”</b> com os botões
          ✅ Aprovar / ❌ Recusar. Ao aprovar, o jogador entra no elenco automaticamente.</>,
      },
      {
        q: 'O telefone e o e-mail são preenchidos sozinhos?',
        a: <>O e-mail é preenchido automaticamente se a pessoa estiver logada. O telefone é sugerido
          pelo próprio celular (autopreenchimento do teclado) — por segurança, nenhum site lê o
          número do aparelho sozinho.</>,
      },
    ],
  },
  {
    id: 'partida', title: 'Criar e sortear a partida', icon: faFutbol, color: '#ccff00',
    items: [
      {
        q: 'Quais modalidades o app suporta?',
        a: <>Futsal (5x5), Society (6x6 ou 7x7) e Campo (11x11). O campo tático e as formações
          mudam automaticamente conforme a modalidade escolhida.</>,
      },
      {
        q: 'Como funciona o sorteio dos times?',
        a: <>Você marca quem está presente (Chamada), inclui convidados avulsos se quiser, e o app
          <b> equilibra os times</b> pelo nível dos jogadores. Também dá pra montar os times
          manualmente, escolhendo quem fica em cada lado.</>,
      },
      {
        q: 'Dá pra escolher a formação tática?',
        a: <>Sim. Cada time tem um quadro tático com formações próprias da modalidade (ex.: 2-3-1 no
          Society 7x7, 4-4-2 no Campo). As posições dos jogadores se ajustam ao campo.</>,
      },
    ],
  },
  {
    id: 'jogo', title: 'Durante o jogo: tempo, placar e súmula', icon: faStopwatch, color: '#00b4ff',
    items: [
      {
        q: 'O cronômetro fica igual em todos os celulares?',
        a: <>Sim! O tempo é sincronizado pelo relógio do servidor. Organizador, espectadores e
          telão veem <b>exatamente o mesmo tempo</b>, mesmo que recarreguem a página, troquem de
          aparelho ou saiam e voltem.</>,
      },
      {
        q: 'Como registro gols, assistências e cartões?',
        a: <>Na aba <b>Súmula</b>, toque em “Evento”, escolha o tipo (Gol, Assistência, Cartão
          Amarelo/Vermelho) e o jogador. O placar atualiza sozinho e o evento aparece no feed com
          o <b>tempo exato (mm:ss)</b> em que aconteceu.</>,
      },
      {
        q: 'Como elejo o craque da partida?',
        a: <>Na aba Súmula, botão “Craque”. Escolha o jogador e ele fica marcado como destaque
          daquela partida.</>,
      },
      {
        q: 'Tem como jogar várias partidas seguidas (ganhou fica)?',
        a: <>Tem. Cada partida de ~10 min é registrada separadamente. Quando o tempo acaba (ou você
          finaliza no botão), você escolhe o vencedor e o <b>próximo time da fila entra</b>
          automaticamente. Tudo fica salvo no histórico.</>,
      },
    ],
  },
  {
    id: 'chat', title: 'Chat ao vivo e comentários', icon: faComments, color: '#a78bfa',
    items: [
      {
        q: 'Como funciona o chat da partida?',
        a: <>Na aba Súmula tem o campo de comentários. Todo mundo que está com a partida aberta vê
          as mensagens em tempo real. Você pode escolher comentar com seu nome ou como um dos
          atletas da partida.</>,
      },
      {
        q: 'Tem filtro de palavrão?',
        a: <>Sim. Mensagens com xingamentos são censuradas automaticamente antes de aparecer pra todos.</>,
      },
    ],
  },
  {
    id: 'notif', title: 'Notificações (avisos)', icon: faBell, color: '#f59e0b',
    items: [
      {
        q: 'Como ativo as notificações?',
        a: <>Na tela de Partidas, toque em <b>“Ativar avisos”</b> e aceite a permissão do navegador.
          Use o botão <b>“Testar”</b> para confirmar que está funcionando.</>,
      },
      {
        q: 'Recebo aviso mesmo com o app fechado?',
        a: <>Sim. Com os avisos ativados, você recebe notificação do sistema (gol, comentário,
          nova solicitação de entrada) mesmo com o app minimizado ou fechado. No iPhone, é preciso
          ter o app <b>instalado na tela inicial</b> para o push funcionar.</>,
      },
      {
        q: 'Ativei mas não chega nada. O que faço?',
        a: <>Confira: (1) você aceitou a permissão do navegador? (2) o botão “Testar” mostra a
          notificação? (3) no iPhone, o app precisa estar instalado na tela inicial. Se o teste
          funciona mas o resto não, verifique se o aparelho que deveria receber está com a aba
          fechada/minimizada (com a partida aberta na frente, aparece só o popup interno).</>,
      },
    ],
  },
  {
    id: 'ios', title: 'iPhone e iOS', icon: faMobileScreen, color: '#00b4ff',
    items: [
      {
        q: 'Como instalo o app no iPhone?',
        a: <ol className="list-decimal pl-4 space-y-1">
          <li>Abra o site no <b>Safari</b> (obrigatório — Chrome/Firefox no iOS não permitem instalação)</li>
          <li>Toque no ícone de compartilhar <b>⬆️</b> na barra inferior do Safari</li>
          <li>Role a lista e toque em <b>"Adicionar à Tela de Início"</b></li>
          <li>Confirme o nome e toque em <b>Adicionar</b></li>
          <li>O ícone aparece na tela inicial — abra por ele para ter tela cheia e notificações</li>
        </ol>,
      },
      {
        q: 'Notificações não chegam no iPhone. O que fazer?',
        a: <ol className="list-decimal pl-4 space-y-1">
          <li>O app <b>precisa estar instalado</b> na tela inicial (passo acima) — sem isso, push não funciona no iOS</li>
          <li>Abra pelo ícone da tela inicial (não pelo Safari diretamente)</li>
          <li>Vá em Partidas → toque <b>"Ativar avisos"</b> e aceite a permissão</li>
          <li>Se o iOS perguntar sobre notificações, toque <b>"Permitir"</b></li>
          <li>Use o botão <b>"Testar"</b> para confirmar que está funcionando</li>
        </ol>,
      },
      {
        q: 'O app funciona no Chrome/Firefox do iPhone?',
        a: <>Funciona para usar normalmente, mas <b>notificações push e instalação na tela inicial</b> só funcionam pelo Safari no iOS. Para a melhor experiência no iPhone, use sempre o Safari.</>,
      },
      {
        q: 'A tela fica cortada ou sobreposta no iPhone X/11/12/13/14/15',
        a: <>O app usa <b>área segura automática</b> (safe area) para respeitar a home bar e o notch. Se algo estiver cortado, atualize a página com força: segure o botão de recarregar no Safari e toque em "Recarregar sem cache".</>,
      },
    ],
  },
  {
    id: 'aovivo', title: 'Placar ao vivo e árbitro', icon: faMobileScreen, color: '#ef4444',
    items: [
      {
        q: 'Como os torcedores acompanham ao vivo?',
        a: <>Na aba Partida, toque em <b>"Placar ao Vivo"</b> e compartilhe o link. Quem recebe abre
          direto no celular e vê placar, cronômetro e feed de lances em tempo real — sem precisar
          criar conta.</>,
      },
      {
        q: 'O que é o link Mesa / Árbitro?',
        a: <>É uma tela simplificada para quem está na mesa registrar os lances (gol, cartão, craque)
          com apenas 2 toques. Compartilhe com o árbitro ou outro editor. Só organizador e editores
          têm acesso.</>,
      },
    ],
  },
  {
    id: 'stats', title: 'Estatísticas', icon: faTableList, color: '#d4a017',
    items: [
      {
        q: 'Quais estatísticas o app guarda?',
        a: <>Gols, assistências, vitórias, craques e pontos de cada jogador, somando todas as
          partidas ao longo do tempo. Tem ranking de artilheiros e histórico de jogos.</>,
      },
      {
        q: 'Dá pra comparar dois jogadores?',
        a: <>Sim, há uma tela de comparação lado a lado (gols, assistências, vitórias, craque, pontos).</>,
      },
    ],
  },
  {
    id: 'fin', title: 'Financeiro', icon: faWallet, color: '#22c55e',
    items: [
      {
        q: 'O que dá pra controlar no financeiro?',
        a: <>Entradas e saídas do clube, mensalistas, cobranças mensais, pendências por jogador e
          o fluxo de caixa (entradas x saídas por mês).</>,
      },
      {
        q: 'Como cobro os mensalistas?',
        a: <>Há a cobrança mensal automática, que gera as mensalidades pendentes de todos os
          mensalistas do mês de uma vez. Também dá pra ver o extrato por jogador e cobrar via WhatsApp.</>,
      },
    ],
  },
  {
    id: 'trouble', title: 'Problemas comuns', icon: faTriangleExclamation, color: '#ef4444',
    items: [
      {
        q: 'O link de convite dá “página não encontrada”.',
        a: <>Use o link que termina em <b>/join</b> (o botão “copiar link” já gera o certo). O link
          é permanente e não expira.</>,
      },
      {
        q: 'O cronômetro estava zerado quando voltei.',
        a: <>Isso foi corrigido — o tempo agora é reconstruído do servidor. Se acontecer com uma
          partida muito antiga, basta dar Pausar e Play uma vez para reativar a sincronização.</>,
      },
      {
        q: 'Não consigo registrar gol / dá erro de permissão.',
        a: <>Geralmente é permissão de quem está logado. Confirme que você é organizador ou editor
          do grupo. Se persistir, recarregue a página.</>,
      },
    ],
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<string | null>('geral-0');

  const handlePdf = () => window.print();

  const handleShare = async () => {
    const url = `${window.location.origin}/faq`;
    const text = 'Partidas Pro — Central de Ajuda: como funciona o app de gestão de peladas';
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      try { await (navigator as any).share({ title: 'Partidas Pro — Ajuda', text, url }); return; } catch { /* cancelado */ }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#020810] text-white">
      {/* CSS de impressão: abre tudo e esconde elementos de navegação */}
      <style>{`
        @media print {
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .faq-answer { display: block !important; }
          * { color: #111 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          a[href]:after { content: ''; }
        }
      `}</style>
      {/* Glows */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[200px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/[0.03] rounded-full blur-[180px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 py-12 relative z-10">
        {/* Voltar */}
        <Link href="/dashboard" className="no-print inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-primary transition-colors mb-8">
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-primary/20 bg-black/40 mb-5">
            <FontAwesomeIcon icon={faCircleQuestion} className="text-primary text-2xl" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
            Central de <span className="text-primary italic">Ajuda</span>
          </h1>
          <p className="text-white/40 text-[11px] mt-4 font-bold uppercase tracking-[0.2em]">
            Tudo sobre o Partidas Pro — como funciona e como usar
          </p>

          {/* Ações: PDF + compartilhar */}
          <div className="no-print flex items-center justify-center gap-3 mt-6">
            <button onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-black font-black uppercase text-[9px] tracking-widest rounded-full hover:scale-105 transition-all">
              <FontAwesomeIcon icon={faShareNodes} /> Compartilhar no WhatsApp
            </button>
            <button onClick={handlePdf}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/15 text-white/70 font-black uppercase text-[9px] tracking-widest rounded-full hover:text-white hover:border-white/30 transition-all">
              <FontAwesomeIcon icon={faFilePdf} /> Baixar PDF
            </button>
          </div>
        </div>

        {/* Sumário */}
        <div className="no-print flex flex-wrap gap-2 justify-center mb-10">
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}
              className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] border border-white/5 text-[9px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:border-white/20 transition-all rounded">
              <FontAwesomeIcon icon={s.icon} style={{ color: s.color, fontSize: 10 }} />
              {s.title}
            </a>
          ))}
        </div>

        {/* Seções */}
        <div className="space-y-10">
          {SECTIONS.map(section => (
            <section key={section.id} id={section.id} className="scroll-mt-6">
              <h2 className="flex items-center gap-3 mb-4 text-sm font-black uppercase tracking-widest"
                style={{ color: section.color }}>
                <FontAwesomeIcon icon={section.icon} />
                {section.title}
              </h2>
              <div className="space-y-2">
                {section.items.map((item, i) => {
                  const key = `${section.id}-${i}`;
                  const isOpen = open === key;
                  return (
                    <div key={key} className="bg-white/[0.02] border border-white/5 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setOpen(isOpen ? null : key)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors">
                        <span className="text-[12px] font-bold text-white/90">{item.q}</span>
                        <FontAwesomeIcon icon={faChevronDown}
                          className="no-print text-white/30 text-xs flex-shrink-0 transition-transform"
                          style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                      </button>
                      <div className="faq-answer px-4 pb-4 pt-1 text-[12px] leading-relaxed text-white/55"
                        style={{ display: isOpen ? 'block' : 'none' }}>
                        {item.a}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <p className="text-center mt-16 text-[9px] text-white/15 font-bold uppercase tracking-[0.5em]">
          Partidas Pro © 2026 — Central de Ajuda
        </p>
      </div>
    </div>
  );
}
