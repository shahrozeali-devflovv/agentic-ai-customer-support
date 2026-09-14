"use client";

import { useEffect, useState } from "react";

import DashboardHeader from "@/components/dashboard-header";
import DashboardSidebar from "@/components/dashboard-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";

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

export default function OrdersPage() {
  const { user, token, isLoading: isAuthLoading } =
    useAuth({
      allowedRoles: ["customer"],
    });

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [isDataLoading, setIsDataLoading] =
    useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      if (!token) {
        return;
      }

      setIsDataLoading(true);
      setError("");

      try {
        const orderData = await apiRequest<Order[]>(
          "/orders",
          {
            token,
          },
        );

        setOrders(orderData);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setIsDataLoading(false);
      }
    }

    loadOrders();
  }, [token]);

  function formatDate(date: string | null) {
    if (!date) {
      return "Not available";
    }

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getStatusClasses(status: string) {
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
              Orders
            </p>

            <h2 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
              Your orders
            </h2>

            <p className="mt-2 max-w-2xl text-text-secondary">
              View your recent orders, delivery status,
              and order information.
            </p>
          </section>

          {isLoading && (
            <div className="rounded-2xl border border-border-soft bg-white p-6">
              <p className="text-text-secondary">
                Loading orders...
              </p>
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-2xl bg-soft-yellow p-5">
              <p className="font-semibold text-text-primary">
                {error}
              </p>
            </div>
          )}

          {!isLoading &&
            !error &&
            orders.length === 0 && (
              <div className="rounded-2xl border border-border-soft bg-white p-8 text-center sm:p-12">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-soft-yellow text-2xl">
                  📦
                </div>

                <h3 className="mt-5 text-lg font-bold text-text-primary">
                  No orders yet
                </h3>

                <p className="mt-2 text-sm text-text-secondary">
                  Your orders will appear here once they
                  are available.
                </p>
              </div>
            )}

          {!isLoading &&
            !error &&
            orders.length > 0 && (
              <>
                <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-border-soft bg-white p-5">
                    <p className="text-sm text-text-secondary">
                      Total orders
                    </p>

                    <p className="mt-2 text-3xl font-bold text-text-primary">
                      {orders.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border-soft bg-white p-5">
                    <p className="text-sm text-text-secondary">
                      Processing
                    </p>

                    <p className="mt-2 text-3xl font-bold text-text-primary">
                      {
                        orders.filter(
                          (order) =>
                            order.status ===
                            "processing",
                        ).length
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border-soft bg-white p-5">
                    <p className="text-sm text-text-secondary">
                      Shipped
                    </p>

                    <p className="mt-2 text-3xl font-bold text-text-primary">
                      {
                        orders.filter(
                          (order) =>
                            order.status ===
                            "shipped",
                        ).length
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl bg-dark-green p-5 text-white">
                    <p className="text-sm text-white/70">
                      Delivered
                    </p>

                    <p className="mt-2 text-3xl font-bold">
                      {
                        orders.filter(
                          (order) =>
                            order.status ===
                            "delivered",
                        ).length
                      }
                    </p>
                  </div>
                </section>

                <section className="space-y-4">
                  {orders.map((order) => (
                    <article
                      key={order.id}
                      className="rounded-2xl border border-border-soft bg-white p-5 sm:p-6"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-bold text-text-primary">
                              {order.order_number}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getStatusClasses(
                                order.status,
                              )}`}
                            >
                              {order.status}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-text-secondary">
                            Placed on{" "}
                            {formatDate(
                              order.placed_at,
                            )}
                          </p>
                        </div>

                        <p className="text-xl font-bold text-dark-green">
                          {order.currency}{" "}
                          {order.total_amount}
                        </p>
                      </div>

                      <div className="mt-5 grid gap-4 border-t border-border-soft pt-5 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            Status
                          </p>

                          <p className="mt-1 text-sm font-semibold capitalize text-text-primary">
                            {order.status}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            Estimated delivery
                          </p>

                          <p className="mt-1 text-sm font-semibold text-text-primary">
                            {formatDate(
                              order.estimated_delivery_at,
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                            Delivered
                          </p>

                          <p className="mt-1 text-sm font-semibold text-text-primary">
                            {formatDate(
                              order.delivered_at,
                            )}
                          </p>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              </>
            )}
        </div>
      </div>
    </main>
  );
}