import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { verification } from "@/drizzle/schema";
import { getPasskeyConfig } from "@/lib/passkey";

export async function POST() {
  const { rpID } = getPasskeyConfig();

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials: [],
  });

  const now = new Date();
  const challengeId = crypto.randomUUID();

  await db.insert(verification).values({
    id: crypto.randomUUID(),
    identifier: `passkey-auth:${challengeId}`,
    value: options.challenge,
    expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ ...options, challengeId });
}
