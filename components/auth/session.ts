"use client";

import { users, type MockUser } from "@/data/seed";

const SESSION_KEY = "loan-manager-session";

export type SessionUser = MockUser;

export function getStoredUser(): SessionUser | null {
  const raw = window.localStorage.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Pick<SessionUser, "id">;
    return users.find((user) => user.id === parsed.id) ?? null;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function signInAs(userId: string): SessionUser | null {
  const user = users.find((candidate) => candidate.id === userId) ?? null;

  if (user) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id }));
  }

  return user;
}

export function signOut() {
  window.localStorage.removeItem(SESSION_KEY);
}
