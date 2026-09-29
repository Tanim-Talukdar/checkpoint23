"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiLock, FiMail, FiLogIn } from "react-icons/fi";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050A14] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/15 border border-blue-500/20">
            <FiLock className="text-2xl text-blue-400" />
          </div>

          <h1 className="text-3xl font-bold">
            Admin Login
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to access the administration panel
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/[0.08] bg-[#07101c]/80 p-6 shadow-2xl"
        >
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Email
            </label>

            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Password
            </label>

            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiLogIn />

            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}