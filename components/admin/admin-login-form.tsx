"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Incorrect email or password.");
      return;
    }

    router.push(params.get("callbackUrl") ?? "/admin/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      <div>
        <label className="block text-xs uppercase tracking-wider text-ink-soft mb-1.5">Email</label>
        <input
          type="email"
          required
          autoComplete="username"
          className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-ink-soft mb-1.5">Password</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-ink/15 bg-white px-4 py-2.5 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-rose-deep">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-7 py-3 rounded-full bg-ink text-white text-sm tracking-wide hover:bg-rose-deep transition-colors disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
