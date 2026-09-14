"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import AdminHeader from "@/components/admin-header";
import AdminSidebar from "@/components/admin-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";

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

export default function AdminConversationsPage() {
  const {
    user: currentAdmin,
    token,
    isLoading: isAuthLoading,
  } = useAuth({
    allowedRoles: ["admin"],
  });

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [isDataLoading, setIsDataLoading] =
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
        const data = await apiRequest<
          Conversation[]
        >("/conversations/admin/all", {
          token,
        });

        setConversations(data);
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
    status: ConversationStatus,
  ) {
    switch (status) {
      case "active":
        return "bg-light-green text-dark-green";

      case "escalated":
        return "bg-soft-yellow text-dark-green";

      case "closed":
        return "bg-gray-100 text-gray-600";

      default:
        return "bg-gray-100 text-gray-600";
    }
  }

  const activeCount = conversations.filter(
    (conversation) =>
      conversation.status === "active",
  ).length;

  const escalatedCount = conversations.filter(
    (conversation) =>
      conversation.status === "escalated",
  ).length;

  const closedCount = conversations.filter(
    (conversation) =>
      conversation.status === "closed",
  ).length;

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
              Support Management
            </p>

            <h2 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
              Conversations
            </h2>

            <p className="mt-2 max-w-2xl text-text-secondary">
              View customer support conversations
              across the platform.
            </p>
          </section>

          {error && (
            <div className="mb-6 rounded-xl bg-soft-yellow px-4 py-3 text-sm font-semibold text-text-primary">
              {error}
            </div>
          )}

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm text-text-secondary">
                Total conversations
              </p>

              <p className="mt-2 text-3xl font-bold text-text-primary">
                {conversations.length}
              </p>
            </div>

            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm text-text-secondary">
                Active
              </p>

              <p className="mt-2 text-3xl font-bold text-dark-green">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm text-text-secondary">
                Escalated
              </p>

              <p className="mt-2 text-3xl font-bold text-text-primary">
                {escalatedCount}
              </p>
            </div>

            <div className="rounded-2xl bg-dark-green p-5 text-white">
              <p className="text-sm text-white/70">
                Closed
              </p>

              <p className="mt-2 text-3xl font-bold">
                {closedCount}
              </p>
            </div>
          </section>

          {isDataLoading && (
            <div className="rounded-2xl border border-border-soft bg-white p-6">
              <p className="text-text-secondary">
                Loading conversations...
              </p>
            </div>
          )}

          {!isDataLoading &&
            conversations.length === 0 &&
            !error && (
              <div className="rounded-2xl border border-border-soft bg-white p-8 text-center">
                <h3 className="text-lg font-bold text-text-primary">
                  No conversations found
                </h3>

                <p className="mt-2 text-sm text-text-secondary">
                  Customer support conversations
                  will appear here.
                </p>
              </div>
            )}

          {!isDataLoading &&
            conversations.length > 0 && (
              <>
                {/* Mobile and tablet cards */}
                <div className="space-y-4 lg:hidden">
                  {conversations.map(
                    (conversation) => (
                      <article
                        key={conversation.id}
                        className="rounded-2xl border border-border-soft bg-white p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-text-secondary">
                              Conversation #
                              {conversation.id}
                            </p>

                            <h3 className="mt-1 break-words font-bold text-text-primary">
                              {conversation.title ||
                                "Untitled conversation"}
                            </h3>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                              conversation.status,
                            )}`}
                          >
                            {conversation.status}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                              Created
                            </p>

                            <p className="mt-1 text-sm text-text-primary">
                              {formatDate(
                                conversation.created_at,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                              Last updated
                            </p>

                            <p className="mt-1 text-sm text-text-primary">
                              {formatDate(
                                conversation.updated_at,
                              )}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/admin/conversations/${conversation.id}`}
                          className="mt-5 block rounded-xl bg-dark-green px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-deep-green"
                        >
                          View conversation
                        </Link>
                      </article>
                    ),
                  )}
                </div>

                {/* Desktop table */}
                <div className="hidden overflow-x-auto rounded-2xl border border-border-soft bg-white lg:block">
                  <table className="w-full min-w-[900px] text-left">
                    <thead className="border-b border-border-soft bg-soft-white">
                      <tr>
                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-text-secondary">
                          Conversation
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-text-secondary">
                          Status
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-text-secondary">
                          Created
                        </th>

                        <th className="px-5 py-4 text-xs font-bold uppercase tracking-wide text-text-secondary">
                          Last Updated
                        </th>

                        <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-text-secondary">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {conversations.map(
                        (conversation) => (
                          <tr
                            key={conversation.id}
                            className="border-b border-border-soft last:border-b-0"
                          >
                            <td className="px-5 py-4">
                              <p className="font-semibold text-text-primary">
                                {conversation.title ||
                                  "Untitled conversation"}
                              </p>

                              <p className="mt-1 text-sm text-text-secondary">
                                #
                                {
                                  conversation.id
                                }
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                                  conversation.status,
                                )}`}
                              >
                                {
                                  conversation.status
                                }
                              </span>
                            </td>

                            <td className="px-5 py-4 text-sm text-text-primary">
                              {formatDate(
                                conversation.created_at,
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm text-text-primary">
                              {formatDate(
                                conversation.updated_at,
                              )}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <Link
                                href={`/admin/conversations/${conversation.id}`}
                                className="inline-block rounded-xl border border-border-soft px-4 py-2 text-sm font-semibold text-dark-green transition hover:border-dark-green hover:bg-soft-yellow"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ),
                      )}
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