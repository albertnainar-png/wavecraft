"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) setError("Invalid email or password");
    else router.push("/");
  }

  return (
    <main className="mx-auto max-w-sm px-5 py-20">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-line bg-panel p-3 text-sm outline-none focus-visible:border-amber"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-line bg-panel p-3 text-sm outline-none focus-visible:border-amber"
        />
        {error && <p className="text-sm text-magenta">{error}</p>}
        <button type="submit" className="w-full rounded-full bg-amber py-2.5 text-sm font-semibold text-ink">
          Sign in
        </button>
      </form>
      <p className="mt-4 text-sm text-muted">
        No account? <a href="/signup" className="text-teal">Create one</a>
      </p>
    </main>
  );
}
