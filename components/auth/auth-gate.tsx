"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Dashboard } from "@/components/dashboard";
import { getStoredUser, type SessionUser } from "@/components/auth/session";

export function AuthGate() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();

    if (!storedUser) {
      router.replace("/login");
      return;
    }

    setUser(storedUser);
    setIsChecking(false);
  }, [router]);

  if (isChecking) {
    return (
      <main className="loadingScreen">
        <div className="brandMark" aria-hidden="true">
          LM
        </div>
        <p>Checking secure session...</p>
      </main>
    );
  }

  return user ? <Dashboard user={user} /> : null;
}
