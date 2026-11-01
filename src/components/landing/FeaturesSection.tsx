import { Gauge, Search, Star, type LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  points: string[];
}

const FEATURES: Feature[] = [
  {
    icon: Gauge,
    title: 'Instant PageSpeed Analysis',
    description: 'See how fast a site loads on phones and desktops, with the Google PageSpeed score ready to share.',
    points: ['Google PageSpeed score', 'Mobile load time in seconds', 'Priority fixes ranked by impact'],
  },
  {
    icon: Star,
    title: 'Google Reviews and Reputation Tracker',
    description: 'Pull the rating and review count for any Google Maps listing and compare it with the top competitor.',
    points: ['Rating and total review count', 'Competitor gap at a glance', 'Clear reputation talking points'],
  },
  {
    icon: Search,
    title: 'Basic SEO Keyword and Meta Check',
    description: 'Catch missing tags and local search gaps that keep a business out of the map pack.',
    points: ['Missing title and meta tags', 'Local business schema check', 'Local search readiness score'],
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-white/5 bg-slate-950 py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-400">Features</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl sm:leading-[1.2]">
            Everything you need to win the local pitch
          </h2>
          <p className="mt-4 text-lg leading-[1.6] text-slate-400">
            Three audits in one run, packaged into a report your client will actually read.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:bg-slate-900"
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-600/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/15 text-indigo-300 ring-1 ring-inset ring-indigo-500/30">
                <feature.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-6 text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 leading-[1.6] text-slate-400">{feature.description}</p>
              <ul className="mt-6 space-y-2.5 border-t border-white/5 pt-6">
                {feature.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
