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
  const visible = links.filter((link) => link.show);

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 self-start border-r border-cabinet-primary-dark/20 bg-cabinet-primary-dark text-white shadow-[18px_0_55px_-38px_rgba(7,54,36,0.75)] md:flex md:flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="overflow-hidden rounded-full border border-cabinet-accent/45 bg-cabinet-cream p-1">
            <Image
              src="/logo.jpeg"
              alt="Cabinet FB"
              width={54}
              height={54}
              className="rounded-full"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="font-heading text-xl font-semibold text-white">Cabinet FB</p>
            <p className="text-xs font-semibold uppercase text-cabinet-accent">Neurologie</p>
          </div>
          <div className="ml-auto pt-1">
            <LogoutButton inverse compact />
          </div>
        </div>
        <div className="mt-5 border-l-2 border-cabinet-accent pl-3">
          <div className="min-w-0">
            <p className="text-xs uppercase text-white/55">Session</p>
            <p className="truncate text-sm font-medium text-white">{userName}</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {visible.map((link) => {
          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-cabinet-cream text-cabinet-primary-dark shadow-sm"
                  : "text-white/76 hover:bg-white/8 hover:text-white"
              }`}
            >
              {active && <span className="absolute inset-y-2 left-0 w-1 rounded-r bg-cabinet-secondary" aria-hidden />}
              <span className="pl-2">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
