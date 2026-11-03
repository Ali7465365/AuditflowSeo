export function DeveloperSection() {
  return (
    <section aria-labelledby="built-by-title" className="border-t border-white/5 bg-slate-950 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md text-center">
          <p id="built-by-title" className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
            Built by
          </p>
          <div className="mx-auto mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600/15 ring-1 ring-inset ring-indigo-500/30">
            <span className="text-lg font-semibold text-indigo-200">SA</span>
          </div>
          <h2 className="mt-5 text-xl font-semibold tracking-tight text-white">Syed Muhammad Aoun</h2>
          <p className="mt-1.5 text-sm text-slate-300">Full-stack developer from Pakistan</p>
          <p className="mt-3 text-sm leading-[1.6] text-slate-400">
            Focused on building clean SaaS products and tools for local businesses.
          </p>
        </div>
      </div>
    </section>
  );
}
