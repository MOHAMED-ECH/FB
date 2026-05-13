import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard-nav";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const u = session.user;
  const isDoctor = u.role === "DOCTOR";

  const links: { href: string; label: string; show: boolean }[] = [
    { href: "/dashboard", label: "Accueil", show: true },
    { href: "/dashboard/agenda", label: "Agenda", show: u.permRdv },
    { href: "/dashboard/waiting", label: "Salle d’attente", show: u.permFile },
    { href: "/dashboard/patients", label: "Patients", show: u.permPatAdm || u.permPatMed || isDoctor },
    { href: "/dashboard/payments", label: "Paiements", show: u.permPaie },
    { href: "/dashboard/stats", label: "Statistiques", show: u.permStats },
    { href: "/dashboard/users", label: "Utilisateurs", show: isDoctor },
    { href: "/dashboard/audit", label: "Journal d’audit", show: isDoctor },
  ];

  return (
    <div className="flex min-h-full">
      <DashboardSidebar links={links} userName={u.name ?? ""} />
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-cabinet-border/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-xl md:hidden">
          <span className="font-heading text-lg font-semibold text-cabinet-primary">Cabinet FB</span>
          <LogoutButton />
        </header>
        <main className="relative flex-1 px-4 py-8 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}
