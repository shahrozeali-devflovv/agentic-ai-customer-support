"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AdminHeader from "@/components/admin-header";
import AdminSidebar from "@/components/admin-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";

type EscalationStatus =
  | "open"
  | "assigned"
  | "resolved";

type Escalation = {
  id: number;
  conversation_id: number;
  assigned_to_user_id: number | null;
  reason: string;
  status: EscalationStatus;
  created_at: string;
  resolved_at: string | null;
};

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

export default function AdminEscalationsPage() {
  const {
    user,
    token,
    isLoading: isAuthLoading,
  } = useAuth({
    allowedRoles: ["admin"],
  });

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [escalations, setEscalations] =
    useState<Escalation[]>([]);

  const [assignableUsers, setAssignableUsers] =
    useState<User[]>([]);

  const [selectedUsers, setSelectedUsers] =
    useState<Record<number, string>>({});

  const [isDataLoading, setIsDataLoading] =
    useState(false);

  const [actionEscalationId, setActionEscalationId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!token) {
        return;
      }

      setIsDataLoading(true);
      setError("");

      try {
        const [
          escalationData,
          userData,
        ] = await Promise.all([
          apiRequest<Escalation[]>(
            "/escalations",
            {
              token,
            },
          ),

          apiRequest<User[]>("/users", {
            token,
          }),
        ]);

        setEscalations(escalationData);

        const supportUsers = userData.filter(
          (item) =>
            item.is_active &&
            (item.role === "admin" ||
              item.role === "support"),
        );

        setAssignableUsers(supportUsers);

        const initialSelections: Record<
          number,
          string
        > = {};

        escalationData.forEach((escalation) => {
          if (escalation.assigned_to_user_id) {
            initialSelections[escalation.id] =
              String(
                escalation.assigned_to_user_id,
              );
          }
        });

        setSelectedUsers(initialSelections);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setIsDataLoading(false);
      }
    }

    loadData();
  }, [token]);

  const openCount = escalations.filter(
    (escalation) =>
      escalation.status === "open",
  ).length;

  const assignedCount = escalations.filter(
    (escalation) =>
      escalation.status === "assigned",
  ).length;

  const resolvedCount = escalations.filter(
    (escalation) =>
      escalation.status === "resolved",
  ).length;

  function formatDate(value: string) {
    return new Date(value).toLocaleString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      },
    );
  }

  function getStatusClasses(
    status: EscalationStatus,
  ) {
    switch (status) {
      case "open":
        return "bg-soft-yellow text-dark-green";

      case "assigned":
        return "bg-light-green text-dark-green";

      case "resolved":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  function getAssignedUserName(
    userId: number | null,
  ) {
    if (!userId) {
      return "Unassigned";
    }

    const assignedUser = assignableUsers.find(
      (item) => item.id === userId,
    );

    return assignedUser
      ? assignedUser.full_name
      : `User #${userId}`;
  }

  async function handleAssign(
    escalationId: number,
  ) {
    if (!token) {
      return;
    }

    const selectedUserId =
      selectedUsers[escalationId];

    if (!selectedUserId) {
      setError(
        "Please select a support user or admin.",
      );
      return;
    }

    setActionEscalationId(escalationId);
    setError("");
    setMessage("");

    try {
      const updatedEscalation =
        await apiRequest<Escalation>(
          `/escalations/${escalationId}/assign`,
          {
            method: "PATCH",
            token,
            body: JSON.stringify({
              assigned_to_user_id:
                Number(selectedUserId),
            }),
          },
        );

      setEscalations((current) =>
        current.map((escalation) =>
          escalation.id === escalationId
            ? updatedEscalation
            : escalation,
        ),
      );

      setMessage(
        `Escalation #${escalationId} assigned successfully.`,
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setActionEscalationId(null);
    }
  }

  async function handleResolve(
    escalationId: number,
  ) {
    if (!token) {
      return;
    }

    setActionEscalationId(escalationId);
    setError("");
    setMessage("");

    try {
      const updatedEscalation =
        await apiRequest<Escalation>(
          `/escalations/${escalationId}/resolve`,
          {
            method: "PATCH",
            token,
          },
        );

      setEscalations((current) =>
        current.map((escalation) =>
          escalation.id === escalationId
            ? updatedEscalation
            : escalation,
        ),
      );

      setMessage(
        `Escalation #${escalationId} resolved successfully.`,
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setActionEscalationId(null);
    }
  }

  if (isAuthLoading || !user) {
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
          userName={user.full_name}
        />

        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-dark-green">
              Escalations
            </p>

            <h1 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
              Human support escalations
            </h1>

            <p className="mt-2 max-w-2xl text-text-secondary">
              Review, assign, and resolve customer
              conversations that require human support.
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm text-text-secondary">
                Total escalations
              </p>

              <p className="mt-2 text-3xl font-bold text-text-primary">
                {isDataLoading
                  ? "..."
                  : escalations.length}
              </p>
            </div>

            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm text-text-secondary">
                Open
              </p>

              <p className="mt-2 text-3xl font-bold text-text-primary">
                {isDataLoading
                  ? "..."
                  : openCount}
              </p>
            </div>

            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm text-text-secondary">
                Assigned
              </p>

              <p className="mt-2 text-3xl font-bold text-text-primary">
                {isDataLoading
                  ? "..."
                  : assignedCount}
              </p>
            </div>

            <div className="rounded-2xl bg-dark-green p-5 text-white">
              <p className="text-sm text-white/70">
                Resolved
              </p>

              <p className="mt-2 text-3xl font-bold">
                {isDataLoading
                  ? "..."
                  : resolvedCount}
              </p>
            </div>
          </section>

          {message && (
            <div className="mt-6 rounded-xl bg-light-green px-4 py-3 text-sm font-semibold text-dark-green">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-xl bg-soft-yellow px-4 py-3 text-sm font-semibold text-text-primary">
              {error}
            </div>
          )}

          {isDataLoading && (
            <div className="mt-8 rounded-2xl border border-border-soft bg-white p-6">
              <p className="text-text-secondary">
                Loading escalations...
              </p>
            </div>
          )}

          {!isDataLoading &&
            !error &&
            escalations.length === 0 && (
              <section className="mt-8 rounded-2xl border border-border-soft bg-white p-8 text-center sm:p-12">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-soft-yellow text-2xl">
                  ⚠️
                </div>

                <h2 className="mt-5 text-lg font-bold text-text-primary">
                  No escalations yet
                </h2>

                <p className="mt-2 text-sm text-text-secondary">
                  Escalated conversations will appear
                  here when human assistance is required.
                </p>
              </section>
            )}

          {!isDataLoading &&
            escalations.length > 0 && (
              <section className="mt-8 space-y-5">
                {escalations.map((escalation) => {
                  const isResolved =
                    escalation.status === "resolved";

                  const isWorking =
                    actionEscalationId ===
                    escalation.id;

                  return (
                    <article
                      key={escalation.id}
                      className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <p className="font-bold text-text-primary">
                              Escalation #
                              {escalation.id}
                            </p>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                                escalation.status,
                              )}`}
                            >
                              {escalation.status}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-text-secondary">
                            Conversation #
                            {
                              escalation.conversation_id
                            }
                          </p>

                          <p className="mt-4 max-w-3xl text-sm leading-6 text-text-primary">
                            {escalation.reason}
                          </p>

                          <div className="mt-4 flex flex-col gap-1 text-xs text-text-secondary sm:flex-row sm:flex-wrap sm:gap-x-6">
                            <p>
                              Assigned:{" "}
                              <span className="font-semibold text-text-primary">
                                {getAssignedUserName(
                                  escalation.assigned_to_user_id,
                                )}
                              </span>
                            </p>

                            <p>
                              Created:{" "}
                              {formatDate(
                                escalation.created_at,
                              )}
                            </p>

                            {escalation.resolved_at && (
                              <p>
                                Resolved:{" "}
                                {formatDate(
                                  escalation.resolved_at,
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                        <Link
                          href={`/admin/conversations/${escalation.conversation_id}`}
                          className="inline-flex w-full items-center justify-center rounded-xl border border-dark-green px-4 py-2.5 text-sm font-bold text-dark-green transition hover:bg-light-green sm:w-auto"
                        >
                          View conversation
                        </Link>
                      </div>

                      {!isResolved && (
                        <div className="mt-6 border-t border-border-soft pt-5">
                          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
                            <div>
                              <label
                                htmlFor={`assign-${escalation.id}`}
                                className="mb-2 block text-sm font-semibold text-text-primary"
                              >
                                Assign to
                              </label>

                              <select
                                id={`assign-${escalation.id}`}
                                value={
                                  selectedUsers[
                                    escalation.id
                                  ] || ""
                                }
                                onChange={(event) =>
                                  setSelectedUsers(
                                    (current) => ({
                                      ...current,
                                      [escalation.id]:
                                        event.target
                                          .value,
                                    }),
                                  )
                                }
                                disabled={isWorking}
                                className="w-full rounded-xl border border-border-soft bg-white px-4 py-3 text-sm text-text-primary outline-none focus:border-dark-green disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <option value="">
                                  Select support user
                                </option>

                                {assignableUsers.map(
                                  (supportUser) => (
                                    <option
                                      key={
                                        supportUser.id
                                      }
                                      value={
                                        supportUser.id
                                      }
                                    >
                                      {
                                        supportUser.full_name
                                      }{" "}
                                      (
                                      {
                                        supportUser.role
                                      }
                                      )
                                    </option>
                                  ),
                                )}
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleAssign(
                                  escalation.id,
                                )
                              }
                              disabled={
                                isWorking ||
                                !selectedUsers[
                                  escalation.id
                                ]
                              }
                              className="rounded-xl bg-yellow px-5 py-3 text-sm font-bold text-dark-green transition hover:bg-yellow-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isWorking
                                ? "Updating..."
                                : escalation.status ===
                                    "assigned"
                                  ? "Reassign"
                                  : "Assign"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleResolve(
                                  escalation.id,
                                )
                              }
                              disabled={isWorking}
                              className="rounded-xl bg-dark-green px-5 py-3 text-sm font-bold text-white transition hover:bg-deep-green disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isWorking
                                ? "Updating..."
                                : "Resolve"}
                            </button>
                          </div>
                        </div>
                      )}

                      {isResolved && (
                        <div className="mt-6 rounded-xl bg-light-green px-4 py-3">
                          <p className="text-sm font-semibold text-dark-green">
                            This escalation has been
                            resolved.
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </section>
            )}
        </div>
      </div>
    </main>
  );
}