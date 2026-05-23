/**
 * Create a clerk account with access to one company.
 *
 * Usage:
 *   DATABASE_URL=... TURSO_AUTH_TOKEN=... BETTER_AUTH_SECRET=... \
 *   bun scripts/create-clerk.ts <email> <password> <name> <companyId>
 *
 * Example:
 *   bun scripts/create-clerk.ts clerk@example.com "Pass123!" "Clerk Name" jeevana
 *   bun scripts/create-clerk.ts clerk@example.com "Pass123!" "Clerk Name" phenix
 */

import { eq } from "drizzle-orm";
import { db } from "../lib/db/index";
import { auth } from "../lib/auth";
import { companies, companyMemberships, user as userTable } from "../drizzle/schema";

const [email, password, name, companyId] = process.argv.slice(2);

if (!email || !password || !name || !companyId) {
  console.error("\nUsage: bun scripts/create-clerk.ts <email> <password> <name> <companyId>\n");
  console.error("  companyId must be one of the IDs in the companies table (e.g. jeevana, phenix)\n");
  process.exit(1);
}

async function run() {
  // Verify company exists
  const [company] = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(eq(companies.id, companyId));

  if (!company) {
    const all = await db.select({ id: companies.id, name: companies.name }).from(companies);
    const ids = all.map((c) => `  • ${c.id} — ${c.name}`).join("\n");
    console.error(`\n✗ Company "${companyId}" not found. Available companies:\n${ids}\n`);
    process.exit(1);
  }

  // Check user doesn't already exist
  const existing = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, email));

  if (existing.length > 0) {
    console.error(`\n✗ A user with email "${email}" already exists.\n`);
    process.exit(1);
  }

  // Create the user via Better Auth
  const result = await auth.api.signUpEmail({ body: { email, password, name } });
  const userId = result.user.id;
  console.log(`\n  ✓ Created user: ${email} (${userId})`);

  // Create clerk membership for the specified company
  await db
    .insert(companyMemberships)
    .values({
      id: crypto.randomUUID(),
      userId,
      companyId: company.id,
      role: "clerk",
      active: true,
      createdAt: new Date().toISOString(),
    })
    .onConflictDoNothing();

  console.log(`  ✓ Clerk membership → ${company.name}`);
  console.log(`\n✓ Clerk account ready.\n  Email:     ${email}\n  Name:      ${name}\n  Company:   ${company.name}\n`);
}

run().catch((err) => {
  console.error("\n✗ Error:", err instanceof Error ? err.message : err, "\n");
  process.exit(1);
}).finally(() => process.exit(0));
