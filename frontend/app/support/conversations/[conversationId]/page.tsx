"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages]);

  async function sendReply() {
    const content = reply.trim();

    if (!token || !content || isSending) {
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
              content,
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

  async function handleReply(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    await sendReply();
  }

  function handleReplyKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (!isSending && reply.trim()) {
        void sendReply();
      }
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
      return "ml-auto bg-dark-green !text-white";
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

          {error && !conversation && (
            <div className="mb-4 rounded-xl bg-soft-yellow px-4 py-3 text-sm font-semibold text-dark-green">
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
              <div className="grid h-[calc(100dvh-155px)] min-h-[560px] gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                {/* Chat */}
                <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border-soft bg-white shadow-sm">
                  {/* Conversation header */}
                  <div className="shrink-0 border-b border-border-soft px-4 py-4 sm:px-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-dark-green">
                      Conversation #
                      {conversation.id}
                    </p>

                    <h1 className="mt-1 text-xl font-bold text-dark-green sm:text-2xl">
                      {conversation.title}
                    </h1>

                    <p className="mt-1 text-sm capitalize text-text-secondary">
                      Status:{" "}
                      {conversation.status}
                    </p>
                  </div>

                  {/* Scrollable messages */}
                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-soft-white p-4 sm:p-5">
                    {messages.length === 0 && (
                      <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-border-soft bg-white p-5 text-center">
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

                    <div
                      ref={messagesEndRef}
                      aria-hidden="true"
                    />
                  </div>

                  {/* Error inside chat */}
                  {error && (
                    <div className="shrink-0 border-t border-border-soft bg-soft-yellow px-4 py-3 text-sm font-semibold text-dark-green sm:px-5">
                      {error}
                    </div>
                  )}

                  {/* Reply box */}
                  <form
                    onSubmit={handleReply}
                    className="shrink-0 border-t border-border-soft bg-white p-4 sm:p-5"
                  >
                    <label
                      htmlFor="support-reply"
                      className="mb-2 block text-sm font-semibold text-dark-green"
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
                      onKeyDown={
                        handleReplyKeyDown
                      }
                      rows={2}
                      placeholder="Type your reply..."
                      disabled={isSending}
                      className="min-h-[72px] w-full resize-none rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-dark-green focus:ring-2 focus:ring-dark-green/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="hidden text-xs text-text-secondary sm:block">
                        Enter to send · Shift +
                        Enter for a new line
                      </p>

                      <button
                        type="submit"
                        disabled={
                          isSending ||
                          !reply.trim()
                        }
                        className="ml-auto w-full rounded-xl bg-dark-green px-5 py-3 text-sm font-bold !text-white transition hover:bg-deep-green disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        {isSending
                          ? "Sending..."
                          : "Send reply"}
                      </button>
                    </div>
                  </form>
                </section>

                {/* Conversation details */}
                <aside className="h-fit rounded-2xl border border-border-soft bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold text-dark-green">
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

                      <p className="mt-1 font-semibold capitalize text-text-primary">
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