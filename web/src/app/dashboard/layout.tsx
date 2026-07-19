import { DashboardSidebar } from "@/components/dashboard-nav";
import { LogoutButton, LogoutConfirmDialog } from "@/components/logout-button";
import { isChiefDoctor, isDoctor, requirePageUser } from "@/lib/authorization";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageUser();
  const doctor = isDoctor(user);
  const chiefDoctor = isChiefDoctor(user);

  const links: { href: string; label: string; show: boolean }[] = [
    { href: "/dashboard", label: "Accueil", show: true },
    { href: "/dashboard/agenda", label: "Agenda", show: user.permRdv || doctor },
    { href: "/dashboard/waiting", label: "Salle d’attente", show: user.permFile || doctor },
    {
      href: "/dashboard/patients",
      label: "Patients",
      show: user.permPatAdm || user.permPatConst || user.permPatMed || doctor,
    },
    { href: "/dashboard/payments", label: "Paiements", show: user.permPaie || doctor },
    { href: "/dashboard/stats", label: "Statistiques", show: user.permStats || doctor },
    { href: "/dashboard/account", label: "Mon compte", show: true },
    { href: "/dashboard/users", label: "Utilisateurs", show: chiefDoctor },
    { href: "/dashboard/audit", label: "Journal d’audit", show: chiefDoctor },
  ];

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar links={links} userName={user.name ?? ""} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-cabinet-border/80 bg-cabinet-card/95 px-4 py-3 shadow-sm md:hidden">
          <span className="font-heading text-lg font-semibold text-cabinet-primary">Cabinet FB</span>
          <LogoutButton />
        </header>
        <main className="relative flex-1 px-4 py-8 md:px-10 md:py-10">{children}</main>
      </div>
      <LogoutConfirmDialog />
    </div>
  );
}
