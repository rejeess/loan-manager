"use server";

import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companies, companyMemberships, customers, loans } from "@/drizzle/schema";
import { newLoanSchema } from "@/lib/schemas/new-loan";
import type { NewLoanInput } from "@/lib/schemas/new-loan";

type CreateLoanResult =
  | { success: true; data: { customerId: string; loanId: string; dcsNumber: string } }
  | { success: false; error: string };

const COMPANY_PRODUCTS: Record<string, ReadonlyArray<"dp" | "wb" | "db" | "el">> = {
  jeevana: ["dp", "wb", "db"],
  phenix: ["dp", "wb", "el"],
};

function deriveTenureDays(companyId: string, product: string): number | null {
  if (product === "dp") return companyId === "jeevana" ? 100 : 50;
  return null;
}

export async function createLoan(input: NewLoanInput): Promise<CreateLoanResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, error: "Not authenticated" };

  const parsed = newLoanSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const data = parsed.data;

  const memberships = await db
    .select({ role: companyMemberships.role })
    .from(companyMemberships)
    .where(
      and(
        eq(companyMemberships.userId, session.user.id),
        eq(companyMemberships.companyId, data.companyId),
        eq(companyMemberships.active, true)
      )
    );

  if (memberships.length === 0) return { success: false, error: "Access denied" };

  const allowed = COMPANY_PRODUCTS[data.companyId];
  if (!allowed || !allowed.includes(data.product)) {
    return { success: false, error: "This loan type is not available for the selected company" };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [company] = await tx
        .select({ nextDcsNumber: companies.nextDcsNumber })
        .from(companies)
        .where(eq(companies.id, data.companyId));

      if (!company) throw new Error("Company not found");

      const dcsNumber = `DCS${company.nextDcsNumber}`;
      const now = new Date();
      const customerId = crypto.randomUUID();
      const loanId = crypto.randomUUID();

      await tx.insert(customers).values({
        id: customerId,
        companyId: data.companyId,
        dcsNumber,
        name: data.customerName,
        coApplicantName: data.coApplicantName || null,
        phone: data.phone,
        coApplicantPhone: data.coApplicantPhone || null,
        area: data.area || null,
        pinCode: data.pinCode || null,
        referredBy: data.referredBy || null,
        createdAt: now,
        updatedAt: now,
      });

      await tx.insert(loans).values({
        id: loanId,
        companyId: data.companyId,
        customerId,
        product: data.product,
        amountPaise: data.amountRupees * 100,
        tenureDays: deriveTenureDays(data.companyId, data.product),
        startDate: data.startDate,
        createdAt: now,
        updatedAt: now,
      });

      await tx
        .update(companies)
        .set({ nextDcsNumber: company.nextDcsNumber + 1 })
        .where(eq(companies.id, data.companyId));

      return { customerId, loanId, dcsNumber };
    });

    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create loan";
    return { success: false, error: message };
  }
}
