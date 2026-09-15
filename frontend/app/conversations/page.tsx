"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";

type Conversation = {
  id: number;
  title: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function ConversationsPage() {
  const router = useRouter();

  const { user, token, isLoading: isAuthLoading } =
    useAuth({
      allowedRoles: ["customer"],
    });

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [isDataLoading, setIsDataLoading] =
    useState(false);

  const [isCreating, setIsCreating] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadConversations() {
      if (!token) {
        return;
      }

      setIsDataLoading(true);
      setError("");

      try {
        const conversationData =
          await apiRequest<Conversation[]>(
            "/conversations",
            {
              token,
            },
          );

        setConversations(conversationData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setIsDataLoading(false);
      }
    }

    loadConversations();
  }, [token]);

  async function handleCreateConversation() {
    if (!token || isCreating) {
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const newConversation =
        await apiRequest<Conversation>(
          "/conversations",
          {
            method: "POST",
            token,
            body: JSON.stringify({
              title: null,
            }),
          },
        );

      router.push(
        `/conversations/${newConversation.id}`,
      );
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }

      setIsCreating(false);
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

  function getStatusClasses(status: string) {
    switch (status) {
      case "active":
        return "bg-light-green text-dark-green";

      case "escalated":
        return "bg-soft-yellow text-dark-green";

      case "closed":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  const isLoading =
    isAuthLoading || isDataLoading;

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
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="lg:ml-72">
        <DashboardHeader
          onMenuClick={() => setIsSidebarOpen(true)}
          userName={user.full_name}
        />

        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-dark-green">
              Conversations
            </p>

            <h2 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
              Support conversations
            </h2>

            <p className="mt-2 max-w-2xl text-text-secondary">
              Start a new AI support conversation or
              continue an existing one.
            </p>
          </section>

          <section className="mb-8 rounded-2xl bg-dark-green p-5 text-white sm:p-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-yellow">
                  AI Support
                </p>

                <h3 className="mt-2 text-xl font-bold sm:text-2xl">
                  How can we help you today?
                </h3>

                <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                  Start a conversation with our AI support
                  assistant. You can ask about your orders,
                  account, company policies, or request
                  human support.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCreateConversation}
                disabled={isCreating}
                className="w-full shrink-0 rounded-xl bg-yellow px-6 py-3 font-bold text-dark-green transition hover:bg-yellow-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isCreating
                  ? "Starting..."
                  : "Start conversation"}
              </button>
            </div>
          </section>

          {error && (
            <div className="mb-6 rounded-xl bg-soft-yellow px-4 py-3 text-sm font-semibold text-text-primary">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="rounded-2xl border border-border-soft bg-white p-6">
              <p className="text-text-secondary">
                Loading conversations...
              </p>
            </div>
          )}

          {!isLoading &&
            !error &&
            conversations.length === 0 && (
              <div className="rounded-2xl border border-border-soft bg-white p-8 text-center sm:p-12">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-soft-yellow text-2xl">
                  💬
                </div>

                <h3 className="mt-5 text-lg font-bold text-text-primary">
                  No conversations yet
                </h3>

                <p className="mt-2 text-sm text-text-secondary">
                  Start your first AI support conversation
                  using the button above.
                </p>
              </div>
            )}

          {!isLoading &&
            conversations.length > 0 && (
              <section className="space-y-4">
                {conversations.map(
                  (conversation) => (
                    <Link
                      key={conversation.id}
                      href={`/conversations/${conversation.id}`}
                      className="block rounded-2xl border border-border-soft bg-white p-5 transition hover:border-dark-green sm:p-6"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="truncate text-lg font-bold text-text-primary">
                              {conversation.title ||
                                `Conversation #${conversation.id}`}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                                conversation.status,
                              )}`}
                            >
                              {conversation.status}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-text-secondary">
                            Created{" "}
                            {formatDate(
                              conversation.created_at,
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 font-semibold text-dark-green">
                          Open
                          <span>→</span>
                        </div>
                      </div>
                    </Link>
                  ),
                )}
              </section>
            )}
        </div>
      </div>
    </main>
  );
}