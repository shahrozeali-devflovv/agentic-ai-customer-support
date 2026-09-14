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
        }
      } finally {
        setIsDataLoading(false);
      }
    }

    loadDashboardData();
  }, [token]);

  const activeUsers = users.filter(
    (user) => user.is_active,
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
              Administration
            </p>

            <h2 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
              Admin dashboard
            </h2>

            <p className="mt-2 max-w-2xl text-text-secondary">
              Manage users, support conversations,
              escalations, knowledge, and AI support
              operations from one place.
            </p>
          </section>

          {error && (
            <div className="mb-6 rounded-xl bg-soft-yellow px-4 py-3 text-sm font-semibold text-text-primary">
              {error}
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm text-text-secondary">
                Users
              </p>

              <p className="mt-2 text-3xl font-bold text-text-primary">
                {isDataLoading
                  ? "..."
                  : users.length}
              </p>

              <p className="mt-2 text-xs text-text-secondary">
                {activeUsers} active user
                {activeUsers === 1 ? "" : "s"}
              </p>
            </div>

            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm text-text-secondary">
                Conversations
              </p>

              <p className="mt-2 text-3xl font-bold text-text-primary">
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
            </div>

            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm text-text-secondary">
                Escalations
              </p>

              <p className="mt-2 text-3xl font-bold text-text-primary">
                {isDataLoading
                  ? "..."
                  : escalatedConversations}
              </p>

              <p className="mt-2 text-xs text-text-secondary">
                Based on conversations currently marked
                as escalated.
              </p>
            </div>

            <div className="rounded-2xl bg-dark-green p-5 text-white">
              <p className="text-sm text-white/70">
                Knowledge Base
              </p>

              <p className="mt-2 text-3xl font-bold">
                —
              </p>

              <p className="mt-2 text-xs text-white/60">
                Knowledge management will be connected
                during the RAG phase.
              </p>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6">
              <h3 className="text-lg font-bold text-text-primary">
                Support operations
              </h3>

              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Customer and conversation data is now
                connected to the admin portal.
              </p>

              <div className="mt-5 rounded-xl bg-soft-yellow p-4">
                <p className="text-sm font-semibold text-dark-green">
                  Core admin data connected
                </p>

                <p className="mt-1 text-sm text-text-secondary">
                  Users and conversations now use real
                  backend data. Escalation management will
                  be implemented next.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6">
              <h3 className="text-lg font-bold text-text-primary">
                AI operations
              </h3>

              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Agent runs, tool calls, knowledge retrieval,
                and AI activity will appear here after the
                agentic AI backend is implemented.
              </p>

              <div className="mt-5 rounded-xl bg-light-green p-4">
                <p className="text-sm font-semibold text-dark-green">
                  Coming in the AI phase
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}