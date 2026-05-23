import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, companyMemberships } from "@/drizzle/schema";
import { NewLoanForm } from "@/components/loans/new-loan-form";

type PageProps = { searchParams: Promise<{ companyId?: string }> };

export default async function NewLoanPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const params = await searchParams;

  const memberships = await db
    .select({ company: companies, role: companyMemberships.role })
    .from(companyMemberships)
    .innerJoin(companies, eq(companyMemberships.companyId, companies.id))
    .where(
      and(
        eq(companyMemberships.userId, session.user.id),
        eq(companyMemberships.active, true)
      )
    );

  if (memberships.length === 0) redirect("/");

  const targetId = params.companyId ?? memberships[0].company.id;
  const membership =
    memberships.find((m) => m.company.id === targetId) ?? memberships[0];

  const [companyRow] = await db
    .select({ nextDcsNumber: companies.nextDcsNumber })
    .from(companies)
    .where(eq(companies.id, membership.company.id));

  return (
    <NewLoanForm
      companyId={membership.company.id}
      companyName={membership.company.name}
      nextDcsNumber={companyRow.nextDcsNumber}
      userRole={membership.role}
    />
  );
}
