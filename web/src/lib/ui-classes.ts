/** Classes Tailwind réutilisées pour une UI cohérente « premium ». */
export const ui = {
  pageWrap: "mx-auto max-w-5xl space-y-8 pb-12",
  pageTitle: "font-heading text-3xl font-semibold tracking-tight text-cabinet-primary md:text-4xl",
  pageSubtitle: "mt-1 text-sm text-cabinet-muted md:text-base",
  card:
    "rounded-2xl border border-cabinet-border/90 bg-white/90 p-6 shadow-[0_10px_40px_-12px_rgba(26,77,51,0.12)] backdrop-blur-md transition-shadow duration-300 hover:shadow-[0_20px_50px_-18px_rgba(26,77,51,0.16)]",
  cardCompact:
    "rounded-2xl border border-cabinet-border/90 bg-white/90 p-4 shadow-[0_10px_40px_-12px_rgba(26,77,51,0.1)] backdrop-blur-md",
  cardList: "divide-y divide-cabinet-border/60",
  input:
    "w-full rounded-xl border border-cabinet-border bg-white/80 px-3 py-2.5 text-sm text-cabinet-text shadow-inner outline-none transition placeholder:text-cabinet-muted/70 focus:border-cabinet-accent focus:ring-2 focus:ring-cabinet-accent/25",
  select:
    "w-full rounded-xl border border-cabinet-border bg-white/80 px-3 py-2.5 text-sm text-cabinet-text outline-none focus:border-cabinet-accent focus:ring-2 focus:ring-cabinet-accent/25",
  btnPrimary:
    "inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-cabinet-primary to-cabinet-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(26,77,51,0.45)] transition hover:brightness-110 active:scale-[0.98]",
  btnSecondary:
    "inline-flex items-center justify-center rounded-xl border border-cabinet-border bg-white/90 px-4 py-2 text-sm font-medium text-cabinet-primary shadow-sm transition hover:border-cabinet-accent/50 hover:bg-cabinet-cream",
  btnGhost:
    "rounded-xl border border-transparent px-3 py-1.5 text-sm font-medium text-cabinet-primary transition hover:border-cabinet-border hover:bg-white/60",
  btnDanger:
    "rounded-xl border border-red-200/80 bg-red-50/80 px-3 py-1.5 text-xs font-medium text-red-800 transition hover:bg-red-100",
  link: "text-sm font-medium text-cabinet-accent-dark underline-offset-4 hover:underline",
  tableHead: "bg-gradient-to-r from-cabinet-primary/12 to-cabinet-accent/15 text-left text-xs font-semibold uppercase tracking-wide text-cabinet-primary",
  statValue: "mt-1 text-2xl font-bold tabular-nums tracking-tight text-cabinet-primary md:text-3xl",
  statLabel: "text-xs font-medium text-cabinet-muted md:text-sm",
} as const;
