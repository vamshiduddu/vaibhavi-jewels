"use client";

import { useActionState } from "react";
import { adminLogin } from "@/lib/admin/auth-actions";

export default function AdminLoginPage() {
  const [state, formAction, pending] = useActionState(adminLogin, null);

  return (
    <div className="admin-login">
      <form action={formAction} className="admin-login-card">
        <h1>Vaibhavi Jewels</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: 0, textAlign: "center" }}>
          Admin sign in
        </p>
        <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 800 }}>
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            style={{ border: "1px solid var(--line)", borderRadius: 6, fontSize: 15, padding: "11px 14px" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 800 }}>
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            style={{ border: "1px solid var(--line)", borderRadius: 6, fontSize: 15, padding: "11px 14px" }}
          />
        </label>
        {state?.error ? <p className="form-error">{state.error}</p> : null}
        <button className="primary-button" type="submit" disabled={pending}>
          {pending ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
