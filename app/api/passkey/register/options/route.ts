import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { passkeys, verification } from "@/drizzle/schema";
import { getPasskeyConfig } from "@/lib/passkey";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rpID, rpName } = getPasskeyConfig();

  const existingPasskeys = await db
    .select({ id: passkeys.id })
    .from(passkeys)
    .where(eq(passkeys.userId, session.user.id));

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: session.user.email,
    userDisplayName: session.user.name,
    attestationType: "none",
    excludeCredentials: existingPasskeys.map((pk) => ({ id: pk.id })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
  });

  const now = new Date();
  const identifier = `passkey-register:${session.user.id}`;

  await db.delete(verification).where(eq(verification.identifier, identifier));
  await db.insert(verification).values({
    id: crypto.randomUUID(),
    identifier,
    value: options.challenge,
    expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json(options);
}
