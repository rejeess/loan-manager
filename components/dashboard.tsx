"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { signOut, type SessionUser } from "@/components/auth/session";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { DcsLookupPanel } from "@/components/dashboard/dcs-lookup-panel";
import { LongPendingPanel } from "@/components/dashboard/long-pending-panel";
import { PaymentPanel } from "@/components/dashboard/payment-panel";
import { ProductsPanel } from "@/components/dashboard/products-panel";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { companies, customers, dashboardStats, overdueItems, products } from "@/data/seed";

type DashboardProps = {
  user: SessionUser;
};

export function Dashboard({ user }: DashboardProps) {
  const router = useRouter();
  const allowedCompanies = useMemo(
    () => companies.filter((company) => user.allowedCompanyIds.includes(company.id)),
    [user.allowedCompanyIds]
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState(user.defaultCompanyId);
  const currentCompany = allowedCompanies.find((company) => company.id === selectedCompanyId) ?? allowedCompanies[0];
  const currentProducts = products.filter((product) => product.companyIds.includes(currentCompany.id));

  function handleSignOut() {
    signOut();
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
