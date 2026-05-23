"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { SessionUser } from "@/components/auth/session";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { DcsLookupPanel } from "@/components/dashboard/dcs-lookup-panel";
import { LongPendingPanel } from "@/components/dashboard/long-pending-panel";
import { PaymentPanel } from "@/components/dashboard/payment-panel";
import { ProductsPanel } from "@/components/dashboard/products-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { customers, dashboardStats, overdueItems, products } from "@/data/seed";

type Company = { id: string; name: string; shortName: string };

type DashboardProps = {
  user: SessionUser;
  companies: Company[];
};

export function Dashboard({ user, companies }: DashboardProps) {
  const router = useRouter();
  const allowedCompanies = useMemo(
    () => companies.filter((company) => user.allowedCompanyIds.includes(company.id)),
    [companies, user.allowedCompanyIds]
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState(user.defaultCompanyId);
  const currentCompany = allowedCompanies.find((company) => company.id === selectedCompanyId) ?? allowedCompanies[0];
  const currentProducts = products.filter((product) => product.companyIds.includes(currentCompany.id));

  async function handleSignOut() {
    await authClient.signOut();
    router.replace("/login");
  }

  return (
    <main className="app">
      <ServiceWorkerRegister />
      <Sidebar user={user} onSignOut={handleSignOut} />
      <section className="workspace">
        <Topbar
          user={user}
          currentCompany={currentCompany}
          allowedCompanies={allowedCompanies}
          onCompanyChange={setSelectedCompanyId}
        />
        <DashboardSummary user={user} stats={dashboardStats} />
        <section className="contentGrid">
          <DcsLookupPanel customers={customers} />
          <ProductsPanel companyShortName={currentCompany.shortName} products={currentProducts} />
          <PaymentPanel />
          <LongPendingPanel user={user} items={overdueItems} />
        </section>
      </section>
    </main>
  );
}
