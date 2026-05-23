import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { and, eq, gt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { passkeys, verification } from "@/drizzle/schema";
import { getPasskeyConfig } from "@/lib/passkey";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const { rpID, origin } = getPasskeyConfig();
  const now = new Date();
  const identifier = `passkey-register:${session.user.id}`;

  const [challenge] = await db
    .select()
    .from(verification)
    .where(and(eq(verification.identifier, identifier), gt(verification.expiresAt, now)));

  if (!challenge) {
    return NextResponse.json({ error: "Challenge expired. Try again." }, { status: 400 });
  }

  await db.delete(verification).where(eq(verification.id, challenge.id));

  let result;
  try {
    result = await verifyRegistrationResponse({
      response: body as unknown as RegistrationResponseJSON,
      expectedChallenge: challenge.value,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  if (!result.verified || !result.registrationInfo) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const { credential, credentialDeviceType, credentialBackedUp } = result.registrationInfo;

  await db.insert(passkeys).values({
    id: credential.id,
    userId: session.user.id,
    publicKey: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    deviceType: credentialDeviceType,
    backedUp: credentialBackedUp,
    transports: credential.transports ? JSON.stringify(credential.transports) : null,
    createdAt: now,
  });

  return NextResponse.json({ success: true });
}
