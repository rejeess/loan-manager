import { eq } from "drizzle-orm";
import { db } from "../lib/db/index";
import { auth } from "../lib/auth";
import { companies, companyMemberships, user as userTable } from "./schema";

const now = new Date().toISOString();

async function ensureUser(
  email: string,
  password: string,
  name: string
): Promise<string> {
  const rows = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, email));
  const existing = rows[0];

  if (existing) {
    console.log(`  ↩ ${email} already exists`);
    return existing.id;
  }

  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  return result.user.id;
}

async function seed() {
  console.log("\nSeeding database...\n");

  await db
    .insert(companies)
    .values([
      { id: "jeevana", name: "Jeevana Loans", shortName: "Jeevana", nextDcsNumber: 111 },
      { id: "phenix", name: "Phenix Money & More", shortName: "Phenix", nextDcsNumber: 1239 },
    ])
    .onConflictDoNothing();
  console.log("  ✓ Companies ready");

  const ownerId = await ensureUser(
    "owner@loanmanager.local",
    "owner-secure-123",
    "Owner"
  );
  await db
    .insert(companyMemberships)
    .values([
      { id: "cm-owner-jeevana", userId: ownerId, companyId: "jeevana", role: "owner", active: true, createdAt: now },
      { id: "cm-owner-phenix", userId: ownerId, companyId: "phenix", role: "owner", active: true, createdAt: now },
    ])
    .onConflictDoNothing();
  console.log("  ✓ Owner → Jeevana Loans + Phenix Money & More");

  const clerkId = await ensureUser(
    "clerk@loanmanager.local",
    "clerk-secure-123",
    "Jeevana Clerk"
  );
  await db
    .insert(companyMemberships)
    .values([
      { id: "cm-clerk-jeevana", userId: clerkId, companyId: "jeevana", role: "clerk", active: true, createdAt: now },
    ])
    .onConflictDoNothing();
  console.log("  ✓ Clerk → Jeevana Loans only");

  console.log("\n✓ Seed complete\n");
  console.log("  Owner:  owner@loanmanager.local  /  owner-secure-123");
  console.log("  Clerk:  clerk@loanmanager.local  /  clerk-secure-123\n");
}

seed().catch(console.error).finally(() => process.exit(0));
