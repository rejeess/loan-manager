"use client";

import { useState, useTransition } from "react";
import { startRegistration } from "@simplewebauthn/browser";

export function PasskeyEnrollButton() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function handleEnroll() {
    setStatus("idle");
    setMessage("");

    startTransition(async () => {
      const optionsRes = await fetch("/api/passkey/register/options", { method: "POST" });
      if (!optionsRes.ok) {
        setStatus("error");
        setMessage("Could not start setup");
        return;
      }

      const optionsJSON = await optionsRes.json();

      let registrationResponse;
      try {
        registrationResponse = await startRegistration({ optionsJSON });
      } catch (err) {
        setStatus("error");
        const errName = err instanceof Error ? err.name : "UnknownError";
        setMessage(
          errName === "NotAllowedError"
            ? "Cancelled"
            : `Setup failed (${errName})`
        );
        return;
      }

      const verifyRes = await fetch("/api/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationResponse),
      });

      if (verifyRes.ok) {
        setStatus("success");
        setMessage("Face ID active");
      } else {
        const data = await verifyRes.json().catch(() => ({})) as { error?: string };
        setStatus("error");
        setMessage(data.error ?? "Setup failed. Try again.");
      }
    });
  }

  return (
    <div style={{ display: "grid", gap: 4 }}>
      {status === "success" ? (
        <span style={{ fontSize: "0.78rem", color: "var(--green, #15803d)", opacity: 0.9 }}>
          ✓ Face ID active
        </span>
      ) : (
        <button
          type="button"
          className="secondaryButton"
          onClick={handleEnroll}
          disabled={isPending}
          style={{ fontSize: "0.78rem", padding: "6px 12px", minHeight: "auto" }}
        >
          {isPending ? "Setting up…" : "Set up Face ID"}
        </button>
      )}
      {status === "error" && (
        <span style={{ fontSize: "0.75rem", color: "var(--red, #b91c1c)", opacity: 0.9 }}>
          {message}
        </span>
      )}
    </div>
  );
}
