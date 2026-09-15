"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";

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

type Message = {
  id: number;
  conversation_id: number;
  sender_type:
    | "customer"
    | "ai"
    | "support";
  sender_user_id: number | null;
  content: string;
  created_at: string;
};

export default function AdminConversationPage() {
  const params = useParams();

  const conversationId = String(
    params.conversationId,
  );

  const {
    user,
    token,
    isLoading: isAuthLoading,
  } = useAuth({
    allowedRoles: ["admin"],
  });

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [conversation, setConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] = useState<
    Message[]
  >([]);

  const [isDataLoading, setIsDataLoading] =
    useState(false);

  const [error, setError] = useState("");

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadConversation() {
      if (!token || !conversationId) {
        return;
      }

      setIsDataLoading(true);
      setError("");

      try {
        const [
          conversationData,
          messageData,
        ] = await Promise.all([
          apiRequest<Conversation>(
            `/conversations/admin/${conversationId}`,
            {
              token,
            },
          ),

          apiRequest<Message[]>(
            `/conversations/${conversationId}/messages/admin`,
            {
              token,
            },
          ),
        ]);

        setConversation(conversationData);
        setMessages(messageData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(
            "Unable to load conversation.",
          );
        }
      } finally {
        setIsDataLoading(false);
      }
    }

    loadConversation();
  }, [conversationId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  function formatTime(value: string) {
    return new Date(
      value,
    ).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatDate(value: string) {
    return new Date(
      value,
    ).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getSenderLabel(
    senderType: Message["sender_type"],
  ) {
    switch (senderType) {
      case "customer":
        return "Customer";

      case "support":
        return "Support Agent";

      case "ai":
        return "AI Support";

      default:
        return "Unknown";
    }
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

        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-5">
              <Link
                href="/admin/conversations"
                className="inline-flex items-center gap-2 text-sm font-semibold text-dark-green transition hover:text-deep-green"
              >
                <span>←</span>
                Back to conversations
              </Link>
            </div>

            {isDataLoading && (
              <div className="rounded-2xl border border-border-soft bg-white p-6">
                <p className="text-text-secondary">
                  Loading conversation...
                </p>
              </div>
            )}

            {!isDataLoading &&
              error &&
              !conversation && (
                <div className="rounded-2xl bg-soft-yellow p-5">
                  <p className="font-semibold text-text-primary">
                    {error}
                  </p>
                </div>
              )}

            {!isDataLoading &&
              conversation && (
                <section className="flex h-[calc(100dvh-190px)] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-border-soft bg-white shadow-sm">
                  <div className="shrink-0 border-b border-border-soft px-4 py-4 sm:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h1 className="text-lg font-bold text-text-primary sm:text-xl">
                            {conversation.title ||
                              `Conversation #${conversation.id}`}
                          </h1>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                              conversation.status,
                            )}`}
                          >
                            {
                              conversation.status
                            }
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-text-secondary">
                          Conversation #
                          {conversation.id}
                        </p>

                        <p className="mt-1 text-xs text-text-secondary">
                          Last updated{" "}
                          {formatDate(
                            conversation.updated_at,
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl bg-soft-yellow px-4 py-2 text-xs font-semibold text-dark-green">
                        Admin view
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto bg-soft-white px-4 py-5 sm:px-6">
                    {messages.length === 0 ? (
                      <div className="flex h-full min-h-[240px] items-center justify-center">
                        <div className="max-w-md text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow text-2xl">
                            💬
                          </div>

                          <h2 className="mt-4 text-lg font-bold text-text-primary">
                            No messages yet
                          </h2>

                          <p className="mt-2 text-sm text-text-secondary">
                            This conversation does
                            not contain any messages
                            yet.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {messages.map(
                          (message) => {
                            const isCustomer =
                              message.sender_type ===
                              "customer";

                            const isAI =
                              message.sender_type ===
                              "ai";

                            return (
                              <div
                                key={message.id}
                                className={`flex ${
                                  isCustomer
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <div className="max-w-[90%] sm:max-w-[75%]">
                                  <div
                                    className={`mb-1 flex items-center gap-2 text-xs text-text-secondary ${
                                      isCustomer
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                                  >
                                    <span className="font-semibold">
                                      {getSenderLabel(
                                        message.sender_type,
                                      )}
                                    </span>

                                    <span>
                                      {formatTime(
                                        message.created_at,
                                      )}
                                    </span>
                                  </div>

                                  <div
                                    className={`rounded-2xl px-4 py-3 text-sm leading-6 sm:text-base ${
                                      isCustomer
                                        ? "rounded-br-md bg-dark-green text-white"
                                        : isAI
                                          ? "rounded-bl-md border border-border-soft bg-white text-text-primary"
                                          : "rounded-bl-md bg-soft-yellow text-text-primary"
                                    }`}
                                  >
                                    {
                                      message.content
                                    }
                                  </div>
                                </div>
                              </div>
                            );
                          },
                        )}

                        <div
                          ref={messagesEndRef}
                        />
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="shrink-0 border-t border-border-soft bg-soft-yellow px-4 py-3 text-sm font-semibold text-text-primary sm:px-6">
                      {error}
                    </div>
                  )}

                  <div className="shrink-0 border-t border-border-soft bg-white px-4 py-4 sm:px-6">
                    <p className="text-center text-sm text-text-secondary">
                      Admin view is read-only.
                      Support agents handle
                      escalated customer
                      conversations.
                    </p>
                  </div>
                </section>
              )}
          </div>
        </div>
      </div>
    </main>
  );
}