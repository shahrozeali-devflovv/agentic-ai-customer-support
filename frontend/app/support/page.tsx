"use client";

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

export default function SupportDashboardPage() {
  const {
    user,
    token,
    isLoading: isAuthLoading,
  } = useAuth({
    allowedRoles: ["support"],
  });

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [assignedEscalations, setAssignedEscalations] =
    useState<Escalation[]>([]);

  const [isDataLoading, setIsDataLoading] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEscalations() {
      if (!token || !user) {
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

setAssignedEscalations(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setIsDataLoading(false);
      }
    }

    loadEscalations();
  }, [token, user]);

  const activeCount =
    assignedEscalations.filter(
      (escalation) =>
        escalation.status === "assigned",
    ).length;

  const resolvedCount =
    assignedEscalations.filter(
      (escalation) =>
        escalation.status === "resolved",
    ).length;

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
              Support dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-text-secondary">
              Review customer cases assigned to you and
              manage human support work.
            </p>
          </section>

          {error && (
            <div className="mb-6 rounded-xl bg-soft-yellow px-4 py-3 text-sm font-semibold text-text-primary">
              {error}
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm text-text-secondary">
                Assigned to me
              </p>

              <p className="mt-2 text-3xl font-bold text-text-primary">
                {isDataLoading
                  ? "..."
                  : assignedEscalations.length}
              </p>
            </div>

            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm text-text-secondary">
                Active
              </p>

              <p className="mt-2 text-3xl font-bold text-text-primary">
                {isDataLoading
                  ? "..."
                  : activeCount}
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

          <section className="mt-8 rounded-2xl border border-border-soft bg-white p-5 sm:p-6">
            <h2 className="text-lg font-bold text-text-primary">
              Support workflow
            </h2>

            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Escalations assigned to your support account
              will appear here. Next we will add the full
              assigned escalation list and customer
              conversation handling.
            </p>

            <div className="mt-5 rounded-xl bg-light-green p-4">
              <p className="text-sm font-semibold text-dark-green">
                Support portal foundation ready
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}