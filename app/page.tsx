import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, companyMemberships } from "@/drizzle/schema";
import { Dashboard } from "@/components/dashboard";
import type { SessionUser } from "@/components/auth/session";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const memberships = await db
    .select({ company: companies, role: companyMemberships.role })
    .from(companyMemberships)
    .innerJoin(companies, eq(companyMemberships.companyId, companies.id))
    .where(eq(companyMemberships.userId, session.user.id));

  if (memberships.length === 0) redirect("/login");

  const role: "owner" | "clerk" = memberships.some((m) => m.role === "owner") ? "owner" : "clerk";

  const sessionUser: SessionUser = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role,
    allowedCompanyIds: memberships.map((m) => m.company.id),
    defaultCompanyId: memberships[0].company.id,
  };

  const userCompanies = memberships.map((m) => ({
    id: m.company.id,
    name: m.company.name,
    shortName: m.company.shortName,
  }));

  return <Dashboard user={sessionUser} companies={userCompanies} />;
}
