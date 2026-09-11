"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { apiRequest } from "@/lib/api";

type RegisterResponse = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleRegister(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setMessage("");
    setIsSubmitting(true);

    try {
      const user = await apiRequest<RegisterResponse>(
        "/auth/register",
        {
          method: "POST",
          body: JSON.stringify({
            full_name: fullName,
            email,
            password,
          }),
        },
      );

      setMessage(
        `Account created successfully for ${user.email}`,
      );

      setFullName("");
      setEmail("");
      setPassword("");
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
        <section className="flex items-center justify-center px-5 py-10 sm:px-8 sm:py-12 lg:px-16">
          <div className="w-full max-w-md">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 sm:mb-10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-dark-green text-lg font-bold text-white">
                A
              </div>

              <span className="text-lg font-semibold text-text-primary">
                Agentic Support
              </span>
            </Link>

            <div className="mb-8">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-dark-green">
                Create account
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
                Get started today
              </h1>

              <p className="mt-4 leading-7 text-text-secondary">
                Create your customer account to manage
                orders and support conversations.
              </p>
            </div>

            <form
              onSubmit={handleRegister}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-semibold text-text-primary"
                >
                  Full name
                </label>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Your full name"
                  required
                  className="w-full rounded-xl border border-border-soft bg-white px-4 py-3.5 text-text-primary outline-none transition focus:border-dark-green focus:ring-2 focus:ring-dark-green/10"
                />
              </div>

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
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-text-primary"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Minimum 8 characters"
                  minLength={8}
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
                  ? "Creating account..."
                  : "Create account"}
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
              Already have an account?{" "}
              <Link
                href="/"
                className="font-semibold text-dark-green hover:text-deep-green"
              >
                Sign in
              </Link>
            </p>
          </div>
        </section>

        <section className="hidden p-6 lg:block">
          <div className="relative flex h-full overflow-hidden rounded-[32px] bg-dark-green p-10 xl:p-12">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-yellow opacity-20 xl:h-72 xl:w-72" />

            <div className="absolute bottom-12 right-12 h-32 w-32 rounded-full border-[22px] border-yellow/20 xl:h-40 xl:w-40" />

            <div className="relative z-10 flex w-full flex-col justify-between text-white">
              <div>
                <div className="inline-flex rounded-full bg-yellow px-4 py-2 text-sm font-bold text-dark-green">
                  Customer support made simple
                </div>

                <h2 className="mt-8 max-w-xl text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                  Everything you need,
                  <span className="text-yellow">
                    {" "}in one place.
                  </span>
                </h2>

                <p className="mt-6 max-w-lg text-base leading-8 text-white/70 xl:text-lg">
                  Create your account and get quick
                  access to orders, support chats,
                  conversation history, and future AI
                  assistance.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow font-bold text-dark-green">
                      1
                    </div>

                    <div>
                      <h3 className="font-semibold">
                        Create your account
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-white/65">
                        Register securely with your
                        email and password.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow font-bold text-dark-green">
                      2
                    </div>

                    <div>
                      <h3 className="font-semibold">
                        Access support
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-white/65">
                        Manage your orders and start
                        support conversations easily.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}