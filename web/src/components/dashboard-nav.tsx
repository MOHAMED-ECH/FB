"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

type LinkItem = { href: string; label: string; show: boolean };

export function DashboardSidebar({
  links,
  userName,
}: {
  links: LinkItem[];
  userName: string;
}) {
  const pathname = usePathname();
  const visible = links.filter((l) => l.show);

  return (
    <aside className="relative hidden w-64 shrink-0 flex-col overflow-hidden border-r border-white/10 bg-gradient-to-b from-cabinet-primary via-cabinet-primary-dark to-[#0d2819] text-white shadow-[8px_0_40px_-12px_rgba(0,0,0,0.35)] md:flex">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cabinet-accent/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/25 to-transparent"
        aria-hidden
      />
      <div className="relative flex items-center gap-3 border-b border-white/10 p-5">
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-cabinet-accent to-cabinet-secondary opacity-60 blur-[2px]" />
          <Image
            src="/logo.jpeg"
            alt=""
            width={48}
            height={48}
            className="relative rounded-full ring-2 ring-white/30"
          />
        </div>
        <div className="min-w-0">
          <p className="font-heading text-lg font-semibold tracking-tight text-white">Cabinet FB</p>
          <p className="truncate text-xs font-medium text-cabinet-accent">Neurologie</p>
          <p className="truncate text-xs text-white/65">{userName}</p>
        </div>
      </div>
      <nav className="relative flex flex-1 flex-col gap-0.5 p-3">
        {visible.map((l) => {
          const active =
            l.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`group relative overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-white/14 text-white shadow-inner ring-1 ring-white/20"
                  : "text-white/80 hover:bg-white/8 hover:text-white"
              }`}
            >
              {active && (
                <span
                  className="absolute inset-y-1 left-0 w-1 rounded-full bg-gradient-to-b from-cabinet-accent to-cabinet-secondary"
                  aria-hidden
                />
              )}
              <span className={active ? "pl-2" : "pl-1 group-hover:pl-2"}>{l.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="relative border-t border-white/10 p-4">
        <LogoutButton inverse />
      </div>
    </aside>
  );
}
