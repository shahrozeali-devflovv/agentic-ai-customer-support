"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import SupportHeader from "@/components/support-header";
import SupportSidebar from "@/components/support-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";

type ConversationStatus =
  | "active"
  | "closed"
  | "escalated";

type Conversation = {
  id: number;
  user_id?: number;
  title: string;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
};

type MessageSenderType =
  | "customer"
  | "ai"
  | "support";

type Message = {
  id: number;
  conversation_id: number;
  sender_type: MessageSenderType;
  sender_user_id: number | null;
  content: string;
  created_at: string;
};

export default function SupportConversationPage() {
  const params = useParams();

  const conversationId = Number(
    params.conversationId,
  );

  const {
    user,
    token,
    isLoading: isAuthLoading,
  } = useAuth({
    allowedRoles: ["support"],
  });

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [conversation, setConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [reply, setReply] = useState("");

  const [isDataLoading, setIsDataLoading] =
    useState(false);

  const [isSending, setIsSending] =
    useState(false);

  const [error, setError] = useState("");

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
            `/conversations/support/${conversationId}`,
            {
              token,
            },
          ),

          apiRequest<Message[]>(
            `/conversations/${conversationId}/messages/support`,
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
        }
      } finally {
        setIsDataLoading(false);
      }
    }

    loadConversation();
  }, [token, conversationId]);

  async function handleReply(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!token || !reply.trim()) {
      return;
    }

    setIsSending(true);
    setError("");

    try {
      const newMessage =
        await apiRequest<Message>(
          `/conversations/${conversationId}/messages/support`,
          {
            method: "POST",
            token,
            body: JSON.stringify({
              content: reply.trim(),
            }),
          },
        );

      setMessages((current) => [
        ...current,
        newMessage,
      ]);

      setReply("");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setIsSending(false);
    }
  }

  function formatDate(value: string) {
    return new Date(value).toLocaleString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      },
    );
  }

  function getSenderLabel(
    senderType: MessageSenderType,
  ) {
    switch (senderType) {
      case "customer":
        return "Customer";

      case "support":
        return "Support";

      case "ai":
        return "AI";

      default:
        return "Message";
    }
  }

  function getMessageClasses(
    senderType: MessageSenderType,
  ) {
    if (senderType === "support") {
      return "ml-auto bg-dark-green text-white";
    }

    if (senderType === "ai") {
      return "bg-light-green text-text-primary";
    }

    return "border border-border-soft bg-white text-text-primary";
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

        <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="mb-4">
            <Link
              href="/support/escalations"
              className="text-sm font-semibold text-dark-green hover:text-deep-green"
            >
              ← Back to assigned escalations
            </Link>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-soft-yellow px-4 py-3 text-sm font-semibold text-text-primary">
              {error}
            </div>
          )}

          {isDataLoading && (
            <div className="rounded-2xl border border-border-soft bg-white p-6">
              <p className="text-text-secondary">
                Loading conversation...
              </p>
            </div>
          )}

          {!isDataLoading &&
            conversation && (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                <section className="overflow-hidden rounded-2xl border border-border-soft bg-white shadow-sm">
                  <div className="border-b border-border-soft px-4 py-4 sm:px-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-dark-green">
                      Conversation #
                      {conversation.id}
                    </p>

                    <h1 className="mt-1 text-xl font-bold text-text-primary sm:text-2xl">
                      {conversation.title}
                    </h1>

                    <p className="mt-1 text-sm capitalize text-text-secondary">
                      Status:{" "}
                      {conversation.status}
                    </p>
                  </div>

                  <div className="max-h-[340px] min-h-[140px] space-y-4 overflow-y-auto bg-soft-white p-4 sm:p-5">
                    {messages.length === 0 && (
                      <div className="flex min-h-[110px] items-center justify-center rounded-xl border border-dashed border-border-soft bg-white p-5 text-center">
                        <p className="text-sm text-text-secondary">
                          No messages in this
                          conversation yet.
                        </p>
                      </div>
                    )}

                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${getMessageClasses(
                          message.sender_type,
                        )}`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-4">
                          <p className="text-xs font-bold">
                            {getSenderLabel(
                              message.sender_type,
                            )}
                          </p>

                          <p className="text-[11px] opacity-70">
                            {formatDate(
                              message.created_at,
                            )}
                          </p>
                        </div>

                        <p className="whitespace-pre-wrap break-words text-sm leading-6">
                          {message.content}
                        </p>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={handleReply}
                    className="border-t border-border-soft bg-white p-4 sm:p-5"
                  >
                    <label
                      htmlFor="support-reply"
                      className="mb-2 block text-sm font-semibold text-text-primary"
                    >
                      Reply to customer
                    </label>

                    <textarea
                      id="support-reply"
                      value={reply}
                      onChange={(event) =>
                        setReply(
                          event.target.value,
                        )
                      }
                      rows={3}
                      placeholder="Type your reply..."
                      disabled={isSending}
                      className="min-h-[90px] w-full resize-y rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-dark-green focus:ring-2 focus:ring-dark-green/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />

                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={
                          isSending ||
                          !reply.trim()
                        }
                        className="w-full rounded-xl bg-dark-green px-5 py-3 text-sm font-bold text-white transition hover:bg-deep-green disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        {isSending
                          ? "Sending..."
                          : "Send reply"}
                      </button>
                    </div>
                  </form>
                </section>

                <aside className="h-fit rounded-2xl border border-border-soft bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold text-text-primary">
                    Conversation details
                  </h2>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm xl:grid-cols-1">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Conversation ID
                      </p>

                      <p className="mt-1 font-semibold text-text-primary">
                        #{conversation.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Customer ID
                      </p>

                      <p className="mt-1 font-semibold text-text-primary">
                        {conversation.user_id
                          ? `#${conversation.user_id}`
                          : "Not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Status
                      </p>

                      <p className="mt-1 capitalize font-semibold text-text-primary">
                        {conversation.status}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Created
                      </p>

                      <p className="mt-1 text-text-primary">
                        {formatDate(
                          conversation.created_at,
                        )}
                      </p>
                    </div>

                    <div className="col-span-2 xl:col-span-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                        Last updated
                      </p>

                      <p className="mt-1 text-text-primary">
                        {formatDate(
                          conversation.updated_at,
                        )}
                      </p>
                    </div>
                  </div>
                </aside>
              </div>
            )}
        </div>
      </div>
    </main>
  );
}