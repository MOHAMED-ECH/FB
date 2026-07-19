export const ui = {
  pageWrap: "mx-auto max-w-6xl space-y-7 pb-12",
  pageHeader:
    "overflow-hidden rounded-lg border border-cabinet-border bg-cabinet-card p-6 shadow-[0_18px_55px_-38px_rgba(7,54,36,0.45)]",
  pageHeaderInner: "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
  pageTitle: "font-heading text-3xl font-semibold text-cabinet-primary-dark md:text-4xl",
  pageSubtitle: "mt-1 max-w-2xl text-sm leading-6 text-cabinet-muted md:text-base",
  card:
    "rounded-lg border border-cabinet-border/90 bg-cabinet-card/95 p-6 shadow-[0_16px_45px_-30px_rgba(7,54,36,0.45)] transition-shadow duration-300 hover:shadow-[0_18px_55px_-34px_rgba(15,90,63,0.5)]",
  cardCompact:
    "rounded-lg border border-cabinet-border/90 bg-cabinet-card/95 p-4 shadow-[0_14px_38px_-30px_rgba(7,54,36,0.4)]",
  cardList: "divide-y divide-cabinet-border/65",
  sectionTitle: "font-heading text-xl font-semibold text-cabinet-primary-dark",
  eyebrow: "text-xs font-semibold uppercase text-cabinet-accent-dark",
  chip:
    "inline-flex items-center rounded-md border border-cabinet-border bg-cabinet-cream px-2.5 py-1 text-xs font-semibold text-cabinet-primary-dark",
  row:
    "group flex flex-col gap-3 px-5 py-4 transition hover:bg-cabinet-cream/55 sm:flex-row sm:items-center sm:justify-between",
  input:
    "w-full rounded-md border border-cabinet-border bg-white px-3 py-2.5 text-sm text-cabinet-text outline-none transition placeholder:text-cabinet-muted/65 focus:border-cabinet-primary focus:ring-2 focus:ring-cabinet-primary/15",
  select:
    "w-full rounded-md border border-cabinet-border bg-white px-3 py-2.5 text-sm text-cabinet-text outline-none transition focus:border-cabinet-primary focus:ring-2 focus:ring-cabinet-primary/15",
  btnPrimary:
    "inline-flex items-center justify-center rounded-md bg-cabinet-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_28px_-18px_rgba(7,54,36,0.7)] transition hover:bg-cabinet-primary-dark active:scale-[0.99]",
  btnSecondary:
    "inline-flex items-center justify-center rounded-md border border-cabinet-border bg-white px-4 py-2 text-sm font-semibold text-cabinet-primary-dark shadow-sm transition hover:border-cabinet-secondary hover:bg-cabinet-cream",
  btnGhost:
    "rounded-md border border-transparent px-3 py-1.5 text-sm font-semibold text-cabinet-primary transition hover:border-cabinet-border hover:bg-white",
  btnDanger:
    "inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 shadow-sm transition hover:bg-red-100",
  link: "text-sm font-semibold text-cabinet-primary underline-offset-4 hover:underline",
  tableHead: "bg-cabinet-primary-dark text-left text-xs font-semibold uppercase text-white",
  statValue: "mt-1 font-heading text-2xl font-semibold tabular-nums text-cabinet-primary-dark md:text-3xl",
  statLabel: "text-xs font-semibold uppercase text-cabinet-muted md:text-sm",
} as const;
