"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";

import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";
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
  content: string;
  created_at: string;
};

type AgentOrder = {
  order_number: string | null;
  status: string | null;
  total_amount: string | null;
  currency: string | null;
  placed_at: string | null;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
};

type AgentMessageResponse = {
  customer_message: Message;
  ai_message: Message | null;
  orders: AgentOrder[] | null;
};

export default function CustomerConversationPage() {
  const params = useParams();

  const conversationId = String(
    params.conversationId,
  );

  const {
    user,
    token,
    isLoading: isAuthLoading,
  } = useAuth({
    allowedRoles: ["customer"],
  });

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [conversation, setConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] = useState<
    Message[]
  >([]);

  const [messageText, setMessageText] =
    useState("");

  const [orders, setOrders] = useState<
    AgentOrder[]
  >([]);

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

        setConversation(
          conversationData,
        );

        setMessages(
          messageData,
        );
      } catch (error) {
        if (error instanceof Error) {
          setError(
            error.message,
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
  }, [messages, orders]);

  async function sendMessage(
    content: string,
  ) {
    if (
      !token ||
      !content.trim() ||
      isSending
    ) {
      return;
    }

    setIsSending(true);
    setError("");

    try {
      const response =
        await apiRequest<AgentMessageResponse>(
          `/conversations/${conversationId}/messages`,
          {
            method: "POST",
            token,
            body: JSON.stringify({
              content: content.trim(),
            }),
          },
        );

      setMessages(
        (currentMessages) => {
          const newMessages = [
            ...currentMessages,
            response.customer_message,
          ];

          if (response.ai_message) {
            newMessages.push(
              response.ai_message,
            );
          }

          return newMessages;
        },
      );

      setOrders(
        response.orders ?? [],
      );

      setMessageText("");
    } catch (error) {
      if (error instanceof Error) {
        setError(
          error.message,
        );
      }
    } finally {
      setIsSending(false);
    }
  }

  async function handleSendMessage(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    await sendMessage(
      messageText,
    );
  }

  async function handleOrderSelect(
    orderNumber: string,
  ) {
    await sendMessage(
      `Tell me the details of order ${orderNumber}`,
    );
  }

  function formatTime(
    value: string,
  ) {
    return new Date(
      value,
    ).toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "2-digit",
      },
    );
  }

  function formatDate(
    value: string,
  ) {
    return new Date(
      value,
    ).toLocaleString(
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

  function formatOrderDate(
    value: string | null,
  ) {
    if (!value) {
      return null;
    }

    return new Date(
      value,
    ).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );
  }

  function getSenderLabel(
    senderType:
      Message["sender_type"],
  ) {
    switch (senderType) {
      case "customer":
        return "You";

      case "support":
        return "Support Agent";

      case "ai":
        return "AI Support";

      default:
        return "Support";
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

  function getOrderStatusClasses(
    status: string | null,
  ) {
    switch (status) {
      case "delivered":
        return "bg-light-green text-dark-green";

      case "shipped":
        return "bg-soft-yellow text-dark-green";

      case "processing":
        return "bg-blue-50 text-blue-700";

      case "pending":
        return "bg-gray-100 text-gray-700";

      case "cancelled":
        return "bg-red-50 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (
    isAuthLoading ||
    !user
  ) {
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
        onClose={() =>
          setIsSidebarOpen(false)
        }
      />

      <div className="lg:ml-72">
        <DashboardHeader
          onMenuClick={() =>
            setIsSidebarOpen(true)
          }
          userName={
            user.full_name
          }
        />

        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-5">
              <Link
                href="/conversations"
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
                <section className="overflow-hidden rounded-2xl border border-border-soft bg-white shadow-sm">
                  <div className="border-b border-border-soft px-4 py-4 sm:px-6">
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
                          {
                            conversation.id
                          }
                        </p>

                        <p className="mt-1 text-xs text-text-secondary">
                          Last updated{" "}
                          {formatDate(
                            conversation.updated_at,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[560px] min-h-[320px] overflow-y-auto bg-soft-white px-4 py-5 sm:px-6">
                    {messages.length ===
                    0 ? (
                      <div className="flex min-h-[240px] items-center justify-center">
                        <div className="max-w-md text-center">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow text-2xl">
                            💬
                          </div>

                          <h2 className="mt-4 text-lg font-bold text-text-primary">
                            Start a conversation
                          </h2>

                          <p className="mt-2 text-sm text-text-secondary">
                            Ask about your
                            orders, refunds,
                            returns, or other
                            support questions.
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
                                key={
                                  message.id
                                }
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

                        {orders.length >
                          0 && (
                          <div className="flex justify-start">
                            <div className="w-full max-w-2xl">
                              <p className="mb-2 text-xs font-semibold text-text-secondary">
                                Your orders
                              </p>

                              <div className="grid gap-3 sm:grid-cols-2">
                                {orders.map(
                                  (
                                    order,
                                  ) => {
                                    if (
                                      !order.order_number
                                    ) {
                                      return null;
                                    }

                                    return (
                                      <button
                                        key={
                                          order.order_number
                                        }
                                        type="button"
                                        disabled={
                                          isSending
                                        }
                                        onClick={() =>
                                          handleOrderSelect(
                                            order.order_number as string,
                                          )
                                        }
                                        className="rounded-2xl border border-border-soft bg-white p-4 text-left shadow-sm transition hover:border-dark-green hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <p className="font-bold text-text-primary">
                                              {
                                                order.order_number
                                              }
                                            </p>

                                            {order.total_amount &&
                                              order.currency && (
                                                <p className="mt-1 text-sm text-text-secondary">
                                                  {
                                                    order.currency
                                                  }{" "}
                                                  {
                                                    order.total_amount
                                                  }
                                                </p>
                                              )}
                                          </div>

                                          <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${getOrderStatusClasses(
                                              order.status,
                                            )}`}
                                          >
                                            {order.status ||
                                              "Unknown"}
                                          </span>
                                        </div>

                                        <div className="mt-3 space-y-1 text-xs text-text-secondary">
                                          {order.placed_at && (
                                            <p>
                                              Placed:{" "}
                                              {formatOrderDate(
                                                order.placed_at,
                                              )}
                                            </p>
                                          )}

                                          {order.estimated_delivery_at && (
                                            <p>
                                              Estimated
                                              delivery:{" "}
                                              {formatOrderDate(
                                                order.estimated_delivery_at,
                                              )}
                                            </p>
                                          )}

                                          {order.delivered_at && (
                                            <p>
                                              Delivered:{" "}
                                              {formatOrderDate(
                                                order.delivered_at,
                                              )}
                                            </p>
                                          )}
                                        </div>

                                        <p className="mt-3 text-xs font-bold text-dark-green">
                                          View order
                                          details →
                                        </p>
                                      </button>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {isSending && (
                          <div className="flex justify-start">
                            <div>
                              <p className="mb-1 text-xs font-semibold text-text-secondary">
                                AI Support
                              </p>

                              <div className="rounded-2xl rounded-bl-md border border-border-soft bg-white px-4 py-3 text-sm text-text-secondary">
                                Thinking...
                              </div>
                            </div>
                          </div>
                        )}

                        <div
                          ref={
                            messagesEndRef
                          }
                        />
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="border-t border-border-soft bg-soft-yellow px-4 py-3 text-sm font-semibold text-text-primary sm:px-6">
                      {error}
                    </div>
                  )}

                  <form
                    onSubmit={
                      handleSendMessage
                    }
                    className="border-t border-border-soft bg-white p-4 sm:p-5"
                  >
                    <label
                      htmlFor="customer-message"
                      className="mb-2 block text-sm font-semibold text-text-primary"
                    >
                      Send a message
                    </label>

                    <textarea
                      id="customer-message"
                      value={
                        messageText
                      }
                      onChange={(
                        event,
                      ) =>
                        setMessageText(
                          event.target
                            .value,
                        )
                      }
                      rows={3}
                      placeholder="Ask about an order, refund, return, or another support question..."
                      disabled={
                        isSending
                      }
                      className="min-h-[90px] w-full resize-y rounded-xl border border-border-soft bg-white px-4 py-3 text-sm text-text-primary outline-none transition placeholder:text-text-secondary focus:border-dark-green focus:ring-2 focus:ring-dark-green/10 disabled:cursor-not-allowed disabled:bg-gray-100"
                    />

                    <div className="mt-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={
                          isSending ||
                          !messageText.trim()
                        }
                        className="w-full rounded-xl bg-dark-green px-5 py-3 text-sm font-bold text-white transition hover:bg-deep-green disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        {isSending
                          ? "AI is thinking..."
                          : "Send message"}
                      </button>
                    </div>
                  </form>
                </section>
              )}
          </div>
        </div>
      </div>
    </main>
  );
}