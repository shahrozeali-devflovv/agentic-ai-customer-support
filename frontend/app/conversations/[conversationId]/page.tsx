"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

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

type Message = {
  id: number;
  conversation_id: number;
  sender_type: "customer" | "ai" | "support";
  content: string;
  created_at: string;
};

export default function ConversationPage() {
  const params = useParams();

  const conversationId = String(params.conversationId);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [conversation, setConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadConversation() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("You are not logged in.");
        setIsLoading(false);
        return;
      }

      try {
        const [
          userData,
          conversationData,
          messageData,
        ] = await Promise.all([
          apiRequest<User>("/users/me", {
            token,
          }),

          apiRequest<Conversation>(
            `/conversations/${conversationId}`,
            {
              token,
            },
          ),

          apiRequest<Message[]>(
            `/conversations/${conversationId}/messages`,
            {
              token,
            },
          ),
        ]);

        setUser(userData);
        setConversation(conversationData);
        setMessages(messageData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSendMessage(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const content = messageText.trim();

    if (!content) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("You are not logged in.");
      return;
    }

    setIsSending(true);
    setError("");

    try {
      const newMessage = await apiRequest<Message>(
        `/conversations/${conversationId}/messages`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            content,
          }),
        },
      );

      setMessages((current) => [
        ...current,
        newMessage,
      ]);

      setMessageText("");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setIsSending(false);
    }
  }

  function formatTime(value: string) {
    return new Date(value).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getSenderLabel(senderType: Message["sender_type"]) {
    switch (senderType) {
      case "customer":
        return "You";

      case "ai":
        return "AI Support";

      case "support":
        return "Support Agent";

      default:
        return "Support";
    }
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

        <div className="flex min-h-[calc(100vh-80px)] flex-col px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
            <div className="mb-5">
              <Link
                href="/conversations"
                className="inline-flex items-center gap-2 text-sm font-semibold text-dark-green transition hover:text-deep-green"
              >
                <span>←</span>
                Back to conversations
              </Link>
            </div>

            {isLoading && (
              <div className="rounded-2xl border border-border-soft bg-white p-6">
                <p className="text-text-secondary">
                  Loading conversation...
                </p>
              </div>
            )}

            {!isLoading && error && !conversation && (
              <div className="rounded-2xl bg-soft-yellow p-5">
                <p className="font-semibold text-text-primary">
                  {error}
                </p>
              </div>
            )}

            {!isLoading && conversation && (
              <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border-soft bg-white">
                <div className="border-b border-border-soft px-4 py-4 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="truncate text-lg font-bold text-text-primary sm:text-xl">
                          {conversation.title ||
                            `Conversation #${conversation.id}`}
                        </h1>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                            conversation.status,
                          )}`}
                        >
                          {conversation.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-text-secondary">
                        Conversation #{conversation.id}
                      </p>
                    </div>

                    <div className="rounded-xl bg-soft-yellow px-3 py-2 text-xs font-semibold text-dark-green">
                      AI replies not connected yet
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-soft-white px-4 py-5 sm:px-6">
                  {messages.length === 0 ? (
                    <div className="flex min-h-[320px] items-center justify-center">
                      <div className="max-w-md text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow text-2xl">
                          💬
                        </div>

                        <h2 className="mt-5 text-lg font-bold text-text-primary">
                          Start the conversation
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-text-secondary">
                          Send your first message below.
                          For now, customer messages are
                          stored normally, but automatic AI
                          replies will be added during the
                          Agentic AI phase.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {messages.map((message) => {
                        const isCustomer =
                          message.sender_type === "customer";

                        return (
                          <div
                            key={message.id}
                            className={`flex ${
                              isCustomer
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[88%] sm:max-w-[75%] ${
                                isCustomer
                                  ? "items-end"
                                  : "items-start"
                              }`}
                            >
                              <div
                                className={`mb-1 flex items-center gap-2 text-xs ${
                                  isCustomer
                                    ? "justify-end text-text-secondary"
                                    : "text-text-secondary"
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
                                    : "rounded-bl-md border border-border-soft bg-white text-text-primary"
                                }`}
                              >
                                {message.content}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {error && (
                  <div className="border-t border-border-soft bg-soft-yellow px-4 py-3 text-sm font-semibold text-text-primary sm:px-6">
                    {error}
                  </div>
                )}

                <div className="border-t border-border-soft bg-white p-4 sm:p-5">
                  {conversation.status === "closed" ? (
                    <div className="rounded-xl bg-gray-100 px-4 py-3 text-center text-sm font-semibold text-gray-600">
                      This conversation is closed.
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSendMessage}
                      className="flex flex-col gap-3 sm:flex-row sm:items-end"
                    >
                      <div className="flex-1">
                        <label
                          htmlFor="message"
                          className="sr-only"
                        >
                          Message
                        </label>

                        <textarea
                          id="message"
                          value={messageText}
                          onChange={(event) =>
                            setMessageText(
                              event.target.value,
                            )
                          }
                          placeholder="Type your message..."
                          rows={2}
                          disabled={isSending}
                          className="max-h-40 min-h-14 w-full resize-y rounded-xl border border-border-soft bg-soft-white px-4 py-3 text-text-primary outline-none transition focus:border-dark-green focus:ring-2 focus:ring-dark-green/10 disabled:opacity-60"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={
                          isSending ||
                          !messageText.trim()
                        }
                        className="h-12 rounded-xl bg-dark-green px-6 font-bold text-white transition hover:bg-deep-green disabled:cursor-not-allowed disabled:opacity-50 sm:h-14"
                      >
                        {isSending
                          ? "Sending..."
                          : "Send"}
                      </button>
                    </form>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}