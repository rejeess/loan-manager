/**
 * One-time script to create the production owner account.
 *
 * Usage:
 *   DATABASE_URL=./db/loan-manager.db bun scripts/create-owner.ts <email> <password> <name>
 *
 * Example:
 *   DATABASE_URL=./db/prod.db bun scripts/create-owner.ts owner@example.com "StrongPass123!" "Owner Name"
 */

import { eq } from "drizzle-orm";
import { db } from "../lib/db/index";
import { auth } from "../lib/auth";
import { companies, companyMemberships, user as userTable } from "../drizzle/schema";

const [email, password, name] = process.argv.slice(2);

if (!email || !password || !name) {
  console.error("\nUsage: bun scripts/create-owner.ts <email> <password> <name>\n");
  process.exit(1);
}

async function run() {
  // Check user doesn't already exist
  const existing = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, email));

  if (existing.length > 0) {
    console.error(`\n✗ A user with email "${email}" already exists.\n`);
    process.exit(1);
  }

  // Fetch all companies
  const allCompanies = await db.select({ id: companies.id, name: companies.name }).from(companies);

  if (allCompanies.length === 0) {
    console.error("\n✗ No companies found. Run migrations and seed companies first.\n");
    process.exit(1);
  }

  // Create the user
  const result = await auth.api.signUpEmail({ body: { email, password, name } });
  const userId = result.user.id;
  console.log(`\n  ✓ Created user: ${email} (${userId})`);

  // Create owner membership for every company
  const now = new Date().toISOString();
  for (const company of allCompanies) {
    await db
      .insert(companyMemberships)
      .values({
        id: crypto.randomUUID(),
        userId,
        companyId: company.id,
        role: "owner",
        active: true,
        createdAt: now,
      })
      .onConflictDoNothing();
    console.log(`  ✓ Owner membership → ${company.name}`);
  }

  console.log(`\n✓ Owner account ready.\n  Email:    ${email}\n  Name:     ${name}\n`);
}

run().catch((err) => {
  console.error("\n✗ Error:", err instanceof Error ? err.message : err, "\n");
  process.exit(1);
}).finally(() => process.exit(0));
