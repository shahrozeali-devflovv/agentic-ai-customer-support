"use client";

import Link from "next/link";
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

type Conversation = {
  id: number;
  title: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function ConversationsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadConversations() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("You are not logged in.");
        setIsLoading(false);
        return;
      }

      try {
        const [userData, conversationData] =
          await Promise.all([
            apiRequest<User>("/users/me", {
              token,
            }),

            apiRequest<Conversation[]>(
              "/conversations",
              {
                token,
              },
            ),
          ]);

        setUser(userData);
        setConversations(conversationData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadConversations();
  }, []);

  async function handleCreateConversation(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("You are not logged in.");
      return;
    }

    setIsCreating(true);
    setError("");
    setMessage("");

    try {
      const newConversation =
        await apiRequest<Conversation>(
          "/conversations",
          {
            method: "POST",
            token,
            body: JSON.stringify({
              title: title.trim() || null,
            }),
          },
        );

      setConversations((current) => [
        newConversation,
        ...current,
      ]);

      setTitle("");
      setMessage("Conversation created successfully.");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setIsCreating(false);
    }
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
              Conversations
            </p>

            <h2 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
              Support conversations
            </h2>

            <p className="mt-2 max-w-2xl text-text-secondary">
              Start a new support conversation or continue
              an existing one.
            </p>
          </section>

          <section className="mb-8 rounded-2xl bg-dark-green p-5 text-white sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-yellow">
                  Start new conversation
                </p>

                <h3 className="mt-2 text-xl font-bold sm:text-2xl">
                  What do you need help with?
                </h3>

                <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
                  Create a conversation now. AI responses
                  will be connected later during the
                  Agentic AI phase.
                </p>
              </div>

              <form
                onSubmit={handleCreateConversation}
                className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto"
              >
                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="e.g. Help with my order"
                  className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white px-4 py-3 text-text-primary outline-none sm:min-w-72"
                />

                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-xl bg-yellow px-5 py-3 font-bold text-dark-green transition hover:bg-yellow-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating
                    ? "Creating..."
                    : "Start conversation"}
                </button>
              </form>
            </div>
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
                  Start your first support conversation
                  using the form above.
                </p>
              </div>
            )}

          {!isLoading && conversations.length > 0 && (
            <section className="space-y-4">
              {conversations.map((conversation) => (
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
              ))}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}