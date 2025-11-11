import Link from "next/link";
import { CORE_GAME_EVENTS } from "@khalistra/shared/constants";

const pillars = [
  {
    title: "Regras Vivas",
    detail: "Cartas de ritual alteram alcance, ordem de turnos e até a geometria do tabuleiro.",
  },
  {
    title: "Progressão Tática",
    detail: "Cada duelo concede essências para desbloquear escolas e experimentos na forja arcana.",
  },
  {
    title: "PvP Event-Driven",
    detail: "Socket.io garante sincronização instantânea e feedback estruturado para cada ação crítica.",
  },
];

const milestones = [
  {
    label: "Protótipo Web",
    description: "Frontend Next.js + Zustand para simular duelos rápidos e validar novas peças.",
  },
  {
    label: "Engine Independente",
    description: "Módulo game-engine com regras isoladas e testes Jest cobrindo 80% do core.",
  },
  {
    label: "Arena Ritual",
    description: "Matchmaking em tempo real, monitorado via OpenTelemetry + Prometheus.",
  },
];

const ritualEvents = CORE_GAME_EVENTS.slice(0, 3);

export default function Home() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden px-4 py-12 sm:px-6 lg:px-0 lg:py-16">
      <div className="aurora" aria-hidden="true" />
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 rounded-[32px] border border-white/10 bg-gradient-to-b from-[rgba(13,6,22,0.85)] to-[rgba(5,3,8,0.92)] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.65)] backdrop-blur">
        <section id="manuscritos" className="flex flex-col gap-8 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-6">
            <p className="text-sm uppercase tracking-[0.4em] text-[rgba(210,165,72,0.85)]">
              Ordem Khalistra
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Estratégias vivas moldadas por rituais, caos controlado e escolhas permanentes.
            </h1>
            <p className="text-lg text-zinc-200">
              Cada jogada pode invocar cartas, distorcer linhas sagradas e reescrever a partida. Nosso
              objetivo é prototipar uma experiência elegante, competitiva e mística — inspirada em
              Chaturanga, Balatro e autochess modernos.
            </p>
            <ul className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.4em] text-white/70">
              {ritualEvents.map((event) => (
                <li
                  key={event}
                  className="rounded-full border border-white/15 px-3 py-1 text-white/80"
                >
                  {event}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4">
              <Link
                href="#laboratorio"
                className="rounded-full bg-[var(--color-ember)] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-[var(--color-ember-strong)]"
              >
                Entrar no laboratório tático
              </Link>
              <Link
                href="#cronograma"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:border-white hover:bg-white/5"
              >
                Consultar roadmap
              </Link>
            </div>
          </div>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-zinc-200 shadow-inner lg:w-auto">
            <p className="text-xs uppercase tracking-[0.25em] text-white/70">
              Stack oficial
            </p>
            <dl className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <dt className="text-white/70">Frontend</dt>
                <dd className="font-semibold text-white">Next.js + Tailwind + Zustand</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-white/70">Backend</dt>
                <dd className="font-semibold text-white">NestJS + Socket.io</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-white/70">Dados</dt>
                <dd className="font-semibold text-white">PostgreSQL + Redis</dd>
              </div>
            </dl>
          </div>
        </section>

        <section id="laboratorio" className="grid gap-6 lg:grid-cols-3">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-lg shadow-black/40"
            >
              <h2 className="text-lg font-semibold text-[var(--color-ember-strong)]">
                {pillar.title}
              </h2>
              <p className="mt-3 text-sm text-zinc-200">{pillar.detail}</p>
              <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <p className="mt-4 text-xs uppercase tracking-[0.3em] text-white/60">Sempre testável</p>
            </article>
          ))}
        </section>

        <section id="cronograma" className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-inner shadow-black/50">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-ember-strong)]">
                Próximos rituais
              </p>
              <h3 className="text-2xl font-semibold text-white">Roadmap de implementação</h3>
            </div>
            <span className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
              Módulos isolados
            </span>
          </header>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {milestones.map((milestone) => (
              <article
                key={milestone.label}
                className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-5"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-white/60">
                  {milestone.label}
                </p>
                <p className="mt-2 text-sm text-zinc-200">{milestone.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
