"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import SupportHeader from "@/components/support-header";
import SupportSidebar from "@/components/support-sidebar";
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

export default function SupportEscalationsPage() {
  const {
    user,
    token,
    isLoading: isAuthLoading,
  } = useAuth({
    allowedRoles: ["support"],
  });

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [escalations, setEscalations] =
    useState<Escalation[]>([]);

  const [isDataLoading, setIsDataLoading] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEscalations() {
      if (!token) {
        return;
      }

      setIsDataLoading(true);
      setError("");

      try {
        const data = await apiRequest<Escalation[]>(
          "/escalations/assigned-to-me",
          {
            token,
          },
        );

        setEscalations(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setIsDataLoading(false);
      }
    }

    loadEscalations();
  }, [token]);

  function formatDate(value: string) {
    return new Date(value).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
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
      <SupportSidebar
        isOpen={isSidebarOpen}
        onClose={() =>
          setIsSidebarOpen(false)
        }
      />

      <div className="lg:ml-72">
        <SupportHeader
          onMenuClick={() =>
            setIsSidebarOpen(true)
          }
          userName={user.full_name}
        />

        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-dark-green">
              Support
            </p>

            <h1 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
              Assigned escalations
            </h1>

            <p className="mt-2 max-w-2xl text-text-secondary">
              View customer cases currently assigned to
              your support account.
            </p>
          </section>

          {error && (
            <div className="mb-6 rounded-xl bg-soft-yellow px-4 py-3 text-sm font-semibold text-text-primary">
              {error}
            </div>
          )}

          {isDataLoading && (
            <div className="rounded-2xl border border-border-soft bg-white p-6">
              <p className="text-text-secondary">
                Loading assigned escalations...
              </p>
            </div>
          )}

          {!isDataLoading &&
            !error &&
            escalations.length === 0 && (
              <section className="rounded-2xl border border-border-soft bg-white p-8 text-center sm:p-12">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-light-green text-2xl">
                  ✓
                </div>

                <h2 className="mt-5 text-lg font-bold text-text-primary">
                  No assigned escalations
                </h2>

                <p className="mt-2 text-sm text-text-secondary">
                  Cases assigned to you by an admin will
                  appear here.
                </p>
              </section>
            )}

          {!isDataLoading &&
            escalations.length > 0 && (
              <section className="space-y-4">
                {escalations.map((escalation) => (
                  <article
                    key={escalation.id}
                    className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-bold text-text-primary">
                            Escalation #{escalation.id}
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
                          {escalation.conversation_id}
                        </p>

                        <p className="mt-4 max-w-3xl text-sm leading-6 text-text-primary">
                          {escalation.reason}
                        </p>

                        <div className="mt-4 flex flex-col gap-1 text-xs text-text-secondary sm:flex-row sm:flex-wrap sm:gap-x-6">
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
                        href={`/support/conversations/${escalation.conversation_id}`}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-dark-green px-4 py-3 text-sm font-bold text-white transition hover:bg-deep-green sm:w-auto"
                      >
                        Open conversation
                      </Link>
                    </div>
                  </article>
                ))}
              </section>
            )}
        </div>
      </div>
    </main>
  );
}