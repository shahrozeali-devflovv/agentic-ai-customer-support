"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${apiUrl}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Login failed",
        );
      }

      localStorage.setItem(
        "access_token",
        data.access_token,
      );

      router.push("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-soft-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <div className="mb-6 inline-flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-green text-lg font-bold text-white">
                  A
                </div>

                <span className="text-lg font-semibold text-text-primary">
                  Agentic Support
                </span>
              </div>

              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-dark-green">
                Welcome back
              </p>

              <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
                Sign in to your account
              </h1>

              <p className="mt-4 leading-7 text-text-secondary">
                Access your orders, support conversations,
                and account information from one place.
              </p>
            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-text-primary"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-border-soft bg-white px-4 py-3.5 text-text-primary outline-none transition focus:border-dark-green focus:ring-2 focus:ring-dark-green/10"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-text-primary"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-sm font-semibold text-dark-green transition hover:text-deep-green"
                  >
                    Forgot password?
                  </button>
                </div>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-border-soft bg-white px-4 py-3.5 text-text-primary outline-none transition focus:border-dark-green focus:ring-2 focus:ring-dark-green/10"
                />
              </div>

              {message && (
                <div className="rounded-xl bg-soft-yellow px-4 py-3 text-sm font-medium text-text-primary">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-dark-green px-5 py-3.5 font-semibold text-white transition hover:bg-deep-green disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Signing in..."
                  : "Sign in"}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-border-soft" />

              <span className="text-sm text-text-secondary">
                or
              </span>

              <div className="h-px flex-1 bg-border-soft" />
            </div>

            <button
              type="button"
              className="w-full rounded-xl border border-border-soft bg-white px-5 py-3.5 font-semibold text-text-primary transition hover:border-dark-green"
            >
              Continue with Google
            </button>

            <p className="mt-8 text-center text-sm text-text-secondary">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-dark-green hover:text-deep-green"
              >
                Create account
              </Link>
            </p>
          </div>
        </section>

        <section className="hidden p-6 lg:block">
          <div className="relative flex h-full overflow-hidden rounded-[32px] bg-dark-green p-12 text-white">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-yellow opacity-20" />

            <div className="absolute bottom-10 right-10 h-36 w-36 rounded-full border-[24px] border-yellow/20" />

            <div className="relative z-10 flex w-full flex-col justify-between">
              <div>
                <div className="inline-flex rounded-full bg-yellow px-4 py-2 text-sm font-bold text-dark-green">
                  Smart support platform
                </div>

                <h2 className="mt-8 max-w-xl text-5xl font-bold leading-tight tracking-tight">
                  Support that works
                  <span className="text-yellow">
                    {" "}smarter.
                  </span>
                </h2>

                <p className="mt-6 max-w-lg text-lg leading-8 text-white/70">
                  Get fast answers, track your orders,
                  manage conversations, and reach human
                  support when you need it.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-yellow text-xl text-dark-green">
                    ✓
                  </div>

                  <h3 className="text-lg font-semibold">
                    Track your orders
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-white/65">
                    Find your latest order status and
                    delivery information quickly.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-yellow text-xl text-dark-green">
                    ✦
                  </div>

                  <h3 className="text-lg font-semibold">
                    Get support faster
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-white/65">
                    Keep your conversations organized
                    and access support from one place.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}