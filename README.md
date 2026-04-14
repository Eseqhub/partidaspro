# Partidas Pro 🏟️⚽

O Partidas Pro é um sistema de gestão de elite para grupos de futebol amador, transformado em uma plataforma SaaS robusta para organizadores e atletas.

## 🚀 Funcionalidades Principais

- **Multi-Tenant (SaaS):** Isolamento total de dados por clube através de slugs dinâmicos.
- **Sorteio Inteligente V2:** Algoritmo biométrico que equilibra times considerando Rating Técnico, IMC (Peso/Altura) e Idade.
- **Recrutamento Digital:** Link exclusivo de convite para atletas criarem seus cards personalizados.
- **Dashboard do Organizador:** Controle total de atletas, partidas, finanças e estatísticas.
- **Súmula em Tempo Real:** Registro de gols, assistências e cartões durante o jogo.

## 🛠️ Stack Tecnológica

- **Frontend:** Next.js 16 (App Router), Tailwind CSS, FontAwesome.
- **Backend:** Supabase (Auth, Postgres, Realtime, Storage).
- **Deployment:** Vercel.

## 🏁 Como Rodar Localmente

1. Clone o repositório.
2. Configure as variáveis de ambiente em `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=seu_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=seu_key
   ```
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o servidor:
   ```bash
   npm run dev
   ```

## 📈 Roadmap

- [x] Rebranding Peladeiros -> Partidas Pro.
- [x] Implementação de URLs amigáveis (/slug).
- [x] Fluxo de entrada pública para jogadores.
- [x] Algoritmo de sorteio inteligente (Biometria).
- [ ] Módulo Financeiro avançado.
- [ ] Dashboards de Estatísticas (Heatmaps, Rankings).

---
**Partidas Pro &copy; 2026 | Performance & Gestão**
