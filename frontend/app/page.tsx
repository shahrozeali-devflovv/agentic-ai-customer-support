"use client";

import { FormEvent, useEffect, useState } from "react";

type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function Home() {
  const [backendStatus, setBackendStatus] = useState("Checking...");

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [accessToken, setAccessToken] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [message, setMessage] = useState("");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    async function checkBackend() {
      try {
        const response = await fetch(`${apiUrl}/health`);

        if (!response.ok) {
          throw new Error("Backend request failed");
        }

        const data = await response.json();
        setBackendStatus(data.status);
      } catch (error) {
        console.error(error);
        setBackendStatus("unavailable");
      }
    }

    checkBackend();
  }, [apiUrl]);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          full_name: fullName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      setMessage(`Registered successfully: ${data.email}`);

      setRegisterEmail("");
      setRegisterPassword("");
      setFullName("");
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      }
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      setAccessToken(data.access_token);
      setCurrentUser(null);

      setMessage("Login successful. JWT received.");
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      }
    }
  }

  async function handleGetCurrentUser() {
    if (!accessToken) {
      setMessage("Please login first.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not retrieve user");
      }

      setCurrentUser(data);
      setMessage("Current user retrieved successfully.");
    } catch (error) {
      if (error instanceof Error) {
        setMessage(error.message);
      }
    }
  }

  function handleLogout() {
    setAccessToken("");
    setCurrentUser(null);
    setMessage("Logged out from the testing UI.");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Agentic AI Customer Support
          </h1>

          <p className="mt-2 text-gray-600">
            Authentication Development UI
          </p>

          <p className="mt-2">
            Backend status:{" "}
            <span className="font-semibold">
              {backendStatus}
            </span>
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">
              Register
            </h2>

            <form
              onSubmit={handleRegister}
              className="space-y-4"
            >
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                className="w-full rounded border p-3"
                required
              />

              <input
                type="email"
                placeholder="Email"
                value={registerEmail}
                onChange={(event) =>
                  setRegisterEmail(event.target.value)
                }
                className="w-full rounded border p-3"
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={registerPassword}
                onChange={(event) =>
                  setRegisterPassword(event.target.value)
                }
                className="w-full rounded border p-3"
                required
              />

              <button
                type="submit"
                className="w-full rounded bg-black p-3 text-white"
              >
                Register
              </button>
            </form>
          </section>

          <section className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">
              Login
            </h2>

            <form
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(event) =>
                  setLoginEmail(event.target.value)
                }
                className="w-full rounded border p-3"
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(event) =>
                  setLoginPassword(event.target.value)
                }
                className="w-full rounded border p-3"
                required
              />

              <button
                type="submit"
                className="w-full rounded bg-black p-3 text-white"
              >
                Login
              </button>
            </form>

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleGetCurrentUser}
                className="rounded bg-blue-600 px-4 py-2 text-white"
              >
                Get My Profile
              </button>

              <button
                onClick={handleLogout}
                className="rounded bg-gray-600 px-4 py-2 text-white"
              >
                Logout
              </button>
            </div>
          </section>
        </div>

        {message && (
          <section className="mt-6 rounded-xl bg-white p-5 shadow">
            <h2 className="font-semibold">
              API Result
            </h2>

            <p className="mt-2">
              {message}
            </p>
          </section>
        )}

        {currentUser && (
          <section className="mt-6 rounded-xl bg-white p-5 shadow">
            <h2 className="mb-3 text-xl font-semibold">
              Current User
            </h2>

            <pre className="overflow-auto rounded bg-gray-900 p-4 text-sm text-white">
              {JSON.stringify(currentUser, null, 2)}
            </pre>
          </section>
        )}

        {accessToken && (
          <section className="mt-6 rounded-xl bg-white p-5 shadow">
            <h2 className="mb-3 text-xl font-semibold">
              JWT Access Token
            </h2>

            <p className="break-all rounded bg-gray-100 p-3 text-sm">
              {accessToken}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}