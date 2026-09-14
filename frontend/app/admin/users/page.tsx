"use client";

import { useEffect, useState } from "react";

import AdminHeader from "@/components/admin-header";
import AdminSidebar from "@/components/admin-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";

type UserRole = "customer" | "support" | "admin";

type User = {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function AdminUsersPage() {
  const { user: currentAdmin, token, isLoading: isAuthLoading } =
    useAuth({
      allowedRoles: ["admin"],
    });

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [isDataLoading, setIsDataLoading] =
    useState(false);

  const [updatingUserId, setUpdatingUserId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUsers() {
      if (!token) {
        return;
      }

      setIsDataLoading(true);
      setError("");

      try {
        const userData = await apiRequest<User[]>(
          "/users",
          {
            token,
          },
        );

        setUsers(userData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setIsDataLoading(false);
      }
    }

    loadUsers();
  }, [token]);

  async function handleStatusChange(
    targetUser: User,
  ) {
    if (!token) {
      return;
    }

    setUpdatingUserId(targetUser.id);
    setError("");
    setMessage("");

    try {
      const updatedUser = await apiRequest<User>(
        `/users/${targetUser.id}/status`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({
            is_active: !targetUser.is_active,
          }),
        },
      );

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === updatedUser.id
            ? updatedUser
            : user,
        ),
      );

      setMessage(
        `${updatedUser.full_name} is now ${
          updatedUser.is_active
            ? "active"
            : "inactive"
        }.`,
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setUpdatingUserId(null);
    }
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );
  }

  function getRoleClasses(role: UserRole) {
    switch (role) {
      case "admin":
        return "bg-dark-green text-white";

      case "support":
        return "bg-soft-yellow text-dark-green";

      case "customer":
        return "bg-light-green text-dark-green";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (isAuthLoading || !currentAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-soft-white">
        <p className="text-text-secondary">
          Checking authentication...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-soft-white">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() =>
          setIsSidebarOpen(false)
        }
      />

      <div className="lg:ml-72">
        <AdminHeader
          onMenuClick={() =>
            setIsSidebarOpen(true)
          }
          userName={currentAdmin.full_name}
        />

        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-dark-green">
              Administration
            </p>

            <h2 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
              Users
            </h2>

            <p className="mt-2 max-w-2xl text-text-secondary">
              View registered users and manage whether
              their accounts are active.
            </p>
          </section>

          {message && (
            <div className="mb-6 rounded-xl bg-light-green px-4 py-3 text-sm font-semibold text-dark-green">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl bg-soft-yellow px-4 py-3 text-sm font-semibold text-text-primary">
              {error}
            </div>
          )}

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm text-text-secondary">
                Total users
              </p>

              <p className="mt-2 text-3xl font-bold text-text-primary">
                {users.length}
              </p>
            </div>

            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm text-text-secondary">
                Customers
              </p>

              <p className="mt-2 text-3xl font-bold text-text-primary">
                {
                  users.filter(
                    (user) =>
                      user.role === "customer",
                  ).length
                }
              </p>
            </div>

            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm text-text-secondary">
                Support
              </p>

              <p className="mt-2 text-3xl font-bold text-text-primary">
                {
                  users.filter(
                    (user) =>
                      user.role === "support",
                  ).length
                }
              </p>
            </div>

            <div className="rounded-2xl bg-dark-green p-5 text-white">
              <p className="text-sm text-white/70">
                Active users
              </p>

              <p className="mt-2 text-3xl font-bold">
                {
                  users.filter(
                    (user) => user.is_active,
                  ).length
                }
              </p>
            </div>
          </section>

          {isDataLoading && (
            <div className="rounded-2xl border border-border-soft bg-white p-6">
              <p className="text-text-secondary">
                Loading users...
              </p>
            </div>
          )}

          {!isDataLoading &&
            users.length === 0 &&
            !error && (
              <div className="rounded-2xl border border-border-soft bg-white p-8 text-center">
                <h3 className="text-lg font-bold text-text-primary">
                  No users found
                </h3>

                <p className="mt-2 text-sm text-text-secondary">
                  Registered users will appear here.
                </p>
              </div>
            )}

          {!isDataLoading &&
            users.length > 0 && (
              <>
                <div className="space-y-4 lg:hidden">
                  {users.map((user) => {
                    const isCurrentAdmin =
                      user.id === currentAdmin.id;

                    return (
                      <article
                        key={user.id}
                        className="rounded-2xl border border-border-soft bg-white p-5"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="truncate font-bold text-text-primary">
                              {user.full_name}
                            </h3>

                            <p className="mt-1 break-all text-sm text-text-secondary">
                              {user.email}
                            </p>
                          </div>

                          <span
                            className={`w-fit rounded-full px-3 py-1 text-xs font-bold capitalize ${getRoleClasses(
                              user.role,
                            )}`}
                          >
                            {user.role}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                              Status
                            </p>

                            <p
                              className={`mt-1 font-semibold ${
                                user.is_active
                                  ? "text-dark-green"
                                  : "text-red-600"
                              }`}
                            >
                              {user.is_active
                                ? "Active"
                                : "Inactive"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                              Joined
                            </p>

                            <p className="mt-1 text-sm font-semibold text-text-primary">
                              {formatDate(
                                user.created_at,
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={
                            updatingUserId ===
                              user.id ||
                            isCurrentAdmin
                          }
                          onClick={() =>
                            handleStatusChange(user)
                          }
                          className="mt-5 w-full rounded-xl border border-border-soft px-4 py-3 text-sm font-semibold text-dark-green transition hover:border-dark-green hover:bg-soft-yellow disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isCurrentAdmin
                            ? "Current admin"
                            : updatingUserId ===
                                user.id
                              ? "Updating..."
                              : user.is_active
                                ? "Deactivate"
                                : "Activate"}
                        </button>
                      </article>
                    );
                  })}
                </div>

                <div className="hidden overflow-x-auto rounded-2xl border border-border-soft bg-white lg:block">
                  <table className="w-full min-w-[900px] text-left">
                    <thead className="border-b border-border-soft bg-soft-white">
                      <tr>
                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-text-secondary">
                          User
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-text-secondary">
                          Role
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-text-secondary">
                          Status
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-text-secondary">
                          Joined
                        </th>

                        <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-text-secondary">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((user) => {
                        const isCurrentAdmin =
                          user.id ===
                          currentAdmin.id;

                        return (
                          <tr
                            key={user.id}
                            className="border-b border-border-soft last:border-b-0"
                          >
                            <td className="px-5 py-4">
                              <p className="font-semibold text-text-primary">
                                {user.full_name}
                              </p>

                              <p className="mt-1 text-sm text-text-secondary">
                                {user.email}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getRoleClasses(
                                  user.role,
                                )}`}
                              >
                                {user.role}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`font-semibold ${
                                  user.is_active
                                    ? "text-dark-green"
                                    : "text-red-600"
                                }`}
                              >
                                {user.is_active
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </td>

                            <td className="px-5 py-4 text-sm text-text-primary">
                              {formatDate(
                                user.created_at,
                              )}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                disabled={
                                  updatingUserId ===
                                    user.id ||
                                  isCurrentAdmin
                                }
                                onClick={() =>
                                  handleStatusChange(
                                    user,
                                  )
                                }
                                className="rounded-xl border border-border-soft px-4 py-2 text-sm font-semibold text-dark-green transition hover:border-dark-green hover:bg-soft-yellow disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isCurrentAdmin
                                  ? "Current admin"
                                  : updatingUserId ===
                                      user.id
                                    ? "Updating..."
                                    : user.is_active
                                      ? "Deactivate"
                                      : "Activate"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
        </div>
      </div>
    </main>
  );
}