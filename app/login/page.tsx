"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { startAuthentication } from "@simplewebauthn/browser";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await authClient.signIn.email({ email, password });

    if (signInError) {
      setError(signInError.message ?? "Sign in failed. Check your email and password.");
      setLoading(false);
      return;
    }

    router.replace("/");
  }

  async function handlePasskeySignIn() {
    setError(null);
    setPasskeyLoading(true);

    try {
      const optionsRes = await fetch("/api/passkey/auth/options", { method: "POST" });
      if (!optionsRes.ok) {
        setError("Could not start Face ID sign-in");
        return;
      }

      const passkeyData = await optionsRes.json() as { challengeId: string } & PublicKeyCredentialRequestOptionsJSON;
      const { challengeId, ...optionsJSON } = passkeyData;

      let authResponse;
      try {
        authResponse = await startAuthentication({ optionsJSON });
      } catch (err) {
        if (err instanceof Error && err.name === "NotAllowedError") {
          setError("Face ID was cancelled");
        } else {
          setError("Face ID sign-in failed");
        }
        return;
      }

      const verifyRes = await fetch("/api/passkey/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, ...authResponse }),
      });

      if (verifyRes.ok) {
        window.location.replace("/");
      } else {
        const data = await verifyRes.json().catch(() => ({})) as { error?: string };
        setError(data.error ?? "Face ID sign-in failed");
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  const busy = loading || passkeyLoading;

  return (
    <main className="loginPage">
      <section className="loginShell" aria-labelledby="login-title">
        <div className="loginBrand">
          <div className="brandMark" aria-hidden="true">
            LM
          </div>
          <div>
            <p className="eyebrow">Private access</p>
            <h1 id="login-title">Loan Manager</h1>
          </div>
        </div>

        <button
          type="button"
          className="passkeyButton"
          onClick={handlePasskeySignIn}
          disabled={busy}
        >
          {passkeyLoading ? "Verifying…" : "Sign in with Face ID"}
        </button>

        <div className="orDivider">
          <span>or</span>
        </div>

        <form className="loginForm" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={busy}
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={busy}
            />
          </label>

          {error && <p className="formError">{error}</p>}

          <button type="submit" className="primaryButton" disabled={busy}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
