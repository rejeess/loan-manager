import { NextRequest, NextResponse } from "next/server";
import type { AuthenticationResponseJSON, AuthenticatorTransportFuture } from "@simplewebauthn/server";

export const dynamic = "force-dynamic";
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

  // Better Auth reads session cookies with getSignedCookie — the value must be
  // token.HMAC-SHA256(token, BETTER_AUTH_SECRET) encoded as base64 (same as makeSignature).
  const secret = process.env.BETTER_AUTH_SECRET ?? "";
  const keyData = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(sessionToken));
  const signedToken = `${sessionToken}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;

  const betterAuthUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  const isSecure = betterAuthUrl.startsWith("https://");
  const cookieName = isSecure
    ? "__Secure-better-auth.session_token"
    : "better-auth.session_token";

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: cookieName,
    value: signedToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
    secure: isSecure,
  });

  return response;
}
