"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

type Order = {
  id: number;
  order_number: string;
  status: string;
  total_amount: string;
  currency: string;
  placed_at: string;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
};

type Conversation = {
  id: number;
  title: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function DashboardPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("You are not logged in.");
        setIsLoading(false);
        return;
      }

      try {
        const [
          userData,
          orderData,
          conversationData,
        ] = await Promise.all([
          apiRequest<User>("/users/me", {
            token,
          }),

          apiRequest<Order[]>("/orders", {
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
        setOrders(orderData);
        setConversations(conversationData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

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
          {isLoading && (
            <div className="rounded-2xl border border-border-soft bg-white p-6">
              <p className="text-text-secondary">
                Loading dashboard...
              </p>
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-2xl bg-soft-yellow p-5">
              <p className="font-semibold text-text-primary">
                {error}
              </p>

              <Link
                href="/"
                className="mt-3 inline-block text-sm font-semibold text-dark-green"
              >
                Return to sign in
              </Link>
            </div>
          )}

          {!isLoading && !error && user && (
            <>
              <section className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-dark-green">
                  Dashboard
                </p>

                <h2 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
                  Hello, {user.full_name}
                </h2>

                <p className="mt-2 max-w-2xl text-text-secondary">
                  Here&apos;s a quick overview of your
                  orders and support activity.
                </p>
              </section>

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6">
                  <p className="text-sm font-medium text-text-secondary">
                    Total orders
                  </p>

                  <p className="mt-3 text-3xl font-bold text-text-primary">
                    {orders.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6">
                  <p className="text-sm font-medium text-text-secondary">
                    Conversations
                  </p>

                  <p className="mt-3 text-3xl font-bold text-text-primary">
                    {conversations.length}
                  </p>
                </div>

                <div className="rounded-2xl bg-dark-green p-5 text-white sm:col-span-2 sm:p-6 xl:col-span-1">
                  <p className="text-sm font-medium text-white/70">
                    Need help?
                  </p>

                  <p className="mt-2 text-xl font-bold">
                    Start a support conversation
                  </p>

                  <Link
                    href="/conversations"
                    className="mt-5 inline-block rounded-xl bg-yellow px-4 py-2.5 text-sm font-bold text-dark-green transition hover:bg-yellow-hover"
                  >
                    Get support
                  </Link>
                </div>
              </section>

              <section className="mt-8 grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">
                        Recent orders
                      </h3>

                      <p className="mt-1 text-sm text-text-secondary">
                        Your latest order activity
                      </p>
                    </div>

                    <Link
                      href="/orders"
                      className="text-sm font-semibold text-dark-green"
                    >
                      View all
                    </Link>
                  </div>

                  {orders.length === 0 ? (
                    <div className="rounded-xl bg-soft-white p-4">
                      <p className="text-sm text-text-secondary">
                        You don&apos;t have any orders yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 3).map((order) => (
                        <div
                          key={order.id}
                          className="flex flex-col gap-3 rounded-xl border border-border-soft p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-semibold text-text-primary">
                              {order.order_number}
                            </p>

                            <p className="mt-1 text-sm capitalize text-text-secondary">
                              {order.status}
                            </p>
                          </div>

                          <p className="font-bold text-dark-green">
                            {order.currency}{" "}
                            {order.total_amount}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">
                        Recent conversations
                      </h3>

                      <p className="mt-1 text-sm text-text-secondary">
                        Your latest support chats
                      </p>
                    </div>

                    <Link
                      href="/conversations"
                      className="text-sm font-semibold text-dark-green"
                    >
                      View all
                    </Link>
                  </div>

                  {conversations.length === 0 ? (
                    <div className="rounded-xl bg-soft-white p-4">
                      <p className="text-sm text-text-secondary">
                        No conversations yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {conversations
                        .slice(0, 3)
                        .map((conversation) => (
                          <Link
                            key={conversation.id}
                            href={`/conversations/${conversation.id}`}
                            className="block rounded-xl border border-border-soft p-4 transition hover:border-dark-green"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-text-primary">
                                  {conversation.title ||
                                    `Conversation #${conversation.id}`}
                                </p>

                                <p className="mt-1 text-sm capitalize text-text-secondary">
                                  {conversation.status}
                                </p>
                              </div>

                              <span className="shrink-0 text-dark-green">
                                →
                              </span>
                            </div>
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}