import { NextRequest, NextResponse } from "next/server";
import type { AuthenticationResponseJSON, AuthenticatorTransportFuture } from "@simplewebauthn/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { passkeys, session as sessionTable, verification } from "@/drizzle/schema";
import { getPasskeyConfig } from "@/lib/passkey";

export async function POST(req: NextRequest) {
  const body = await req.json() as Record<string, unknown>;
  const { challengeId, ...authResponse } = body as { challengeId: string } & Record<string, unknown>;

  const { rpID, origin } = getPasskeyConfig();
  const now = new Date();

  const [challenge] = await db
    .select()
    .from(verification)
    .where(
      and(
        eq(verification.identifier, `passkey-auth:${challengeId}`),
        gt(verification.expiresAt, now)
      )
    );

  if (!challenge) {
    return NextResponse.json({ error: "Challenge expired. Try again." }, { status: 400 });
  }

  await db.delete(verification).where(eq(verification.id, challenge.id));

  const credentialId = authResponse.id as string;
  const [passkey] = await db
    .select()
    .from(passkeys)
    .where(eq(passkeys.id, credentialId));

  if (!passkey) {
    return NextResponse.json({ error: "Passkey not registered on this device" }, { status: 400 });
  }

  let result;
  try {
    result = await verifyAuthenticationResponse({
      response: authResponse as unknown as AuthenticationResponseJSON,
      expectedChallenge: challenge.value,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.id,
        publicKey: Buffer.from(passkey.publicKey, "base64url"),
        counter: passkey.counter,
        transports: passkey.transports
          ? (JSON.parse(passkey.transports) as AuthenticatorTransportFuture[])
          : undefined,
      },
    });
  } catch {
    return NextResponse.json({ error: "Authentication failed" }, { status: 400 });
  }

  if (!result.verified) {
    return NextResponse.json({ error: "Authentication failed" }, { status: 400 });
  }

  await db
    .update(passkeys)
    .set({ counter: result.authenticationInfo.newCounter })
    .where(eq(passkeys.id, passkey.id));

  const sessionToken = crypto.randomUUID();

  await db.insert(sessionTable).values({
    id: crypto.randomUUID(),
    userId: passkey.userId,
    token: sessionToken,
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    createdAt: now,
    updatedAt: now,
    ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null,
    userAgent: req.headers.get("user-agent") ?? null,
  });

  const isSecure = req.nextUrl.protocol === "https:";
  const cookieName = isSecure
    ? "__Secure-better-auth.session_token"
    : "better-auth.session_token";

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: cookieName,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
    secure: isSecure,
  });

  return response;
}
