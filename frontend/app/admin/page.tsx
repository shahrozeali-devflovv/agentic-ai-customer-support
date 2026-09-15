"use client";

import Link from "next/link";
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

type ConversationStatus =
  | "active"
  | "escalated"
  | "closed";

type Conversation = {
  id: number;
  title: string | null;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
};

export default function AdminDashboardPage() {
  const {
    user,
    token,
    isLoading: isAuthLoading,
  } = useAuth({
    allowedRoles: ["admin"],
  });

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [users, setUsers] = useState<User[]>([]);

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [isDataLoading, setIsDataLoading] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      if (!token) {
        return;
      }

      setIsDataLoading(true);
      setError("");

      try {
        const [
          userData,
          conversationData,
        ] = await Promise.all([
          apiRequest<User[]>("/users", {
            token,
          }),

          apiRequest<Conversation[]>(
            "/conversations/admin/all",
            {
              token,
            },
          ),
        ]);

        setUsers(userData);
        setConversations(conversationData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(
            "Unable to load dashboard data.",
          );
        }
      } finally {
        setIsDataLoading(false);
      }
    }

    loadDashboardData();
  }, [token]);

  const activeUsers = users.filter(
    (item) => item.is_active,
  ).length;

  const activeConversations =
    conversations.filter(
      (conversation) =>
        conversation.status === "active",
    ).length;

  const escalatedConversations =
    conversations.filter(
      (conversation) =>
        conversation.status === "escalated",
    ).length;

  if (isAuthLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-soft-white">
        <p className="text-dark-green">
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
          {/* Page heading */}
          <section className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-dark-green">
              Administration
            </p>

            <h1 className="mt-2 text-2xl font-bold text-dark-green sm:text-3xl">
              Admin dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-text-secondary">
              Monitor customer support activity
              and manage the main operations of
              the support platform.
            </p>
          </section>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl bg-soft-yellow px-4 py-3 text-sm font-semibold text-dark-green">
              {error}
            </div>
          )}

          {/* Summary cards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/admin/users"
              className="rounded-2xl border border-border-soft bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-dark-green">
                Users
              </p>

              <p className="mt-2 text-3xl font-bold text-dark-green">
                {isDataLoading
                  ? "..."
                  : users.length}
              </p>

              <p className="mt-2 text-xs text-text-secondary">
                {activeUsers} active user
                {activeUsers === 1 ? "" : "s"}
              </p>
            </Link>

            <Link
              href="/admin/conversations"
              className="rounded-2xl border border-border-soft bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-dark-green">
                Conversations
              </p>

              <p className="mt-2 text-3xl font-bold text-dark-green">
                {isDataLoading
                  ? "..."
                  : conversations.length}
              </p>

              <p className="mt-2 text-xs text-text-secondary">
                {activeConversations} active
                conversation
                {activeConversations === 1
                  ? ""
                  : "s"}
              </p>
            </Link>

            <Link
              href="/admin/escalations"
              className="rounded-2xl border border-border-soft bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-dark-green">
                Escalations
              </p>

              <p className="mt-2 text-3xl font-bold text-dark-green">
                {isDataLoading
                  ? "..."
                  : escalatedConversations}
              </p>

              <p className="mt-2 text-xs text-text-secondary">
                Conversations currently marked
                as escalated
              </p>
            </Link>

            <Link
              href="/admin/knowledge-base"
              className="rounded-2xl border border-dark-green bg-dark-green p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-white">
                Knowledge Base
              </p>

              <p className="mt-2 text-xl font-bold text-white">
                Manage knowledge
              </p>

              <p className="mt-3 text-xs leading-5 text-white/80">
                Upload and manage documents used
                by the AI support agent.
              </p>
            </Link>
          </section>

          {/* Operations */}
          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold text-dark-green">
                Support operations
              </h2>

              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Review customer conversations and
                manage cases that require human
                support.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/admin/conversations"
                  className="rounded-xl bg-dark-green px-4 py-2.5 text-sm font-semibold !text-white transition hover:bg-deep-green hover:!text-white"
                >
                  View conversations
                </Link>

                <Link
                  href="/admin/escalations"
                  className="rounded-xl border border-dark-green bg-white px-4 py-2.5 text-sm font-semibold text-dark-green transition hover:bg-soft-white"
                >
                  View escalations
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6">
              <h2 className="text-lg font-bold text-dark-green">
                AI operations
              </h2>

              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Review agent activity, including
                agent runs, intents, outcomes,
                escalations, and tool usage.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/admin/agent-activity"
                  className="rounded-xl bg-dark-green px-4 py-2.5 text-sm font-semibold !text-white transition hover:bg-deep-green hover:!text-white"
                >
                  View agent activity
                </Link>

                <Link
                  href="/admin/knowledge-base"
                  className="rounded-xl border border-dark-green bg-white px-4 py-2.5 text-sm font-semibold text-dark-green transition hover:bg-soft-white"
                >
                  Manage knowledge
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}