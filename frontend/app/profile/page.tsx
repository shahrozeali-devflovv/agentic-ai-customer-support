"use client";

import { FormEvent, useEffect, useState } from "react";

import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { apiRequest } from "@/lib/api";

type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function ProfilePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("You are not logged in.");
        setIsLoading(false);
        return;
      }

      try {
        const userData = await apiRequest<User>(
          "/users/me",
          {
            token,
          },
        );

        setUser(userData);
        setFullName(userData.full_name);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleUpdateProfile(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("You are not logged in.");
      return;
    }

    const trimmedName = fullName.trim();

    if (!trimmedName) {
      setError("Full name is required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const updatedUser = await apiRequest<User>(
        "/users/me",
        {
          method: "PATCH",
          token,
          body: JSON.stringify({
            full_name: trimmedName,
          }),
        },
      );

      setUser(updatedUser);
      setFullName(updatedUser.full_name);

      setMessage("Profile updated successfully.");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setIsSaving(false);
    }
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-soft-white">
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="lg:ml-72">
        <DashboardHeader
          onMenuClick={() => setIsSidebarOpen(true)}
          userName={user?.full_name || "Customer"}
        />

        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-dark-green">
              Profile
            </p>

            <h2 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
              Account information
            </h2>

            <p className="mt-2 max-w-2xl text-text-secondary">
              View and update your personal account
              information.
            </p>
          </section>

          {isLoading && (
            <div className="rounded-2xl border border-border-soft bg-white p-6">
              <p className="text-text-secondary">
                Loading profile...
              </p>
            </div>
          )}

          {!isLoading && error && !user && (
            <div className="rounded-2xl bg-soft-yellow p-5">
              <p className="font-semibold text-text-primary">
                {error}
              </p>
            </div>
          )}

          {!isLoading && user && (
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <section className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-text-primary">
                    Personal details
                  </h3>

                  <p className="mt-1 text-sm text-text-secondary">
                    Update your name. Your email is
                    currently read-only.
                  </p>
                </div>

                {message && (
                  <div className="mb-5 rounded-xl bg-light-green px-4 py-3 text-sm font-semibold text-dark-green">
                    {message}
                  </div>
                )}

                {error && (
                  <div className="mb-5 rounded-xl bg-soft-yellow px-4 py-3 text-sm font-semibold text-text-primary">
                    {error}
                  </div>
                )}

                <form
                  onSubmit={handleUpdateProfile}
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
                      required
                      className="w-full rounded-xl border border-border-soft bg-soft-white px-4 py-3.5 text-text-primary outline-none transition focus:border-dark-green focus:ring-2 focus:ring-dark-green/10"
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
                      value={user.email}
                      disabled
                      className="w-full cursor-not-allowed rounded-xl border border-border-soft bg-gray-100 px-4 py-3.5 text-text-secondary"
                    />

                    <p className="mt-2 text-xs text-text-secondary">
                      Email changes are not supported yet.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isSaving ||
                      !fullName.trim() ||
                      fullName.trim() === user.full_name
                    }
                    className="w-full rounded-xl bg-dark-green px-5 py-3.5 font-semibold text-white transition hover:bg-deep-green disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isSaving
                      ? "Saving..."
                      : "Save changes"}
                  </button>
                </form>
              </section>

              <aside className="space-y-6">
                <div className="rounded-2xl bg-dark-green p-6 text-white">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow text-2xl font-bold text-dark-green">
                    {user.full_name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <h3 className="mt-5 text-xl font-bold">
                    {user.full_name}
                  </h3>

                  <p className="mt-1 break-all text-sm text-white/65">
                    {user.email}
                  </p>

                  <div className="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold capitalize">
                    {user.role}
                  </div>
                </div>

                <div className="rounded-2xl border border-border-soft bg-white p-5">
                  <h3 className="font-bold text-text-primary">
                    Account details
                  </h3>

                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Account status
                      </p>

                      <p className="mt-1 font-semibold text-dark-green">
                        {user.is_active
                          ? "Active"
                          : "Inactive"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Member since
                      </p>

                      <p className="mt-1 text-sm font-semibold text-text-primary">
                        {formatDate(user.created_at)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        User ID
                      </p>

                      <p className="mt-1 text-sm font-semibold text-text-primary">
                        #{user.id}
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}