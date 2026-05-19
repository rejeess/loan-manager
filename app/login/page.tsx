"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInAs } from "@/components/auth/session";
import { users } from "@/data/seed";

export default function LoginPage() {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState(users[0].id);
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    signInAs(selectedUserId);
    router.replace("/");
  }

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

        <form className="loginForm" onSubmit={handleSubmit}>
          <label>
            User type
            <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.role === "owner" ? "Owner" : "Clerk"} - {user.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Email
            <input value={selectedUser.email} readOnly />
          </label>

          <label>
            Password
            <input value="demo-password" readOnly type="password" />
          </label>

          <div className="loginAccessBox">
            <span className="rolePill">{selectedUser.role}</span>
            <p>
              {selectedUser.role === "owner"
                ? "Full access to both companies, reports, settings, and approvals."
                : "Clerk access for assigned company operations, payments, and DCS lookup."}
            </p>
          </div>

          <button type="submit" className="primaryButton">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
