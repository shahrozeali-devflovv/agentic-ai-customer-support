"use client";

import { useEffect, useState } from "react";

import AdminHeader from "@/components/admin-header";
import AdminSidebar from "@/components/admin-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api";

type AgentToolCall = {
  id: number;
  agent_run_id: number;
  tool_name: string;
  success: boolean;
  input_summary: string | null;
  output_summary: string | null;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
};

type AgentRun = {
  id: number;
  conversation_id: number;
  user_id: number;
  customer_message: string;
  intent: string | null;
  outcome:
    | "answered"
    | "escalated"
    | "failed"
    | null;
  escalated: boolean;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  tool_calls: AgentToolCall[];
};

function getOutcomeClasses(
  outcome: AgentRun["outcome"],
) {
  if (outcome === "answered") {
    return "bg-light-green text-dark-green";
  }

  if (outcome === "escalated") {
    return "bg-soft-yellow text-dark-green";
  }

  if (outcome === "failed") {
    return "bg-red-50 text-red-700";
  }

  return "bg-gray-100 text-text-secondary";
}

function formatDuration(
  startedAt: string,
  completedAt: string | null,
) {
  if (!completedAt) {
    return "In progress";
  }

  const start = new Date(
    startedAt,
  ).getTime();

  const end = new Date(
    completedAt,
  ).getTime();

  const duration = end - start;

  if (duration < 1000) {
    return `${duration} ms`;
  }

  return `${(
    duration / 1000
  ).toFixed(2)} s`;
}

export default function AgentActivityPage() {
  const {
    user,
    token,
    isLoading: isAuthLoading,
  } = useAuth({
    allowedRoles: ["admin"],
  });

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [runs, setRuns] = useState<
    AgentRun[]
  >([]);

  const [expandedRunId, setExpandedRunId] =
    useState<number | null>(null);

  const [isFetching, setIsFetching] =
    useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAgentRuns() {
      if (!token) {
        return;
      }

      setIsFetching(true);
      setError("");

      try {
        const data =
          await apiRequest<AgentRun[]>(
            "/agent-activity",
            {
              token,
            },
          );

        setRuns(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(
            "Could not load agent activity",
          );
        }
      } finally {
        setIsFetching(false);
      }
    }

    loadAgentRuns();
  }, [token]);

  const answeredCount = runs.filter(
    (run) => run.outcome === "answered",
  ).length;

  const escalatedCount = runs.filter(
    (run) => run.outcome === "escalated",
  ).length;

  const failedCount = runs.filter(
    (run) => run.outcome === "failed",
  ).length;

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

        <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <section className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-dark-green">
              AI Observability
            </p>

            <h2 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
              Agent Activity
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary sm:text-base">
              Inspect AI agent runs, detected
              intents, outcomes, escalations,
              tool usage, execution time, and
              failures.
            </p>
          </section>

          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm font-semibold text-text-secondary">
                Total runs
              </p>

              <p className="mt-2 text-3xl font-bold text-dark-green">
                {runs.length}
              </p>
            </div>

            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm font-semibold text-text-secondary">
                Answered
              </p>

              <p className="mt-2 text-3xl font-bold text-dark-green">
                {answeredCount}
              </p>
            </div>

            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm font-semibold text-text-secondary">
                Escalated
              </p>

              <p className="mt-2 text-3xl font-bold text-dark-green">
                {escalatedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-border-soft bg-white p-5">
              <p className="text-sm font-semibold text-text-secondary">
                Failed
              </p>

              <p className="mt-2 text-3xl font-bold text-red-700">
                {failedCount}
              </p>
            </div>
          </section>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <section className="rounded-2xl border border-border-soft bg-white p-4 sm:p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-text-primary">
                Recent agent runs
              </h3>

              <p className="mt-1 text-sm text-text-secondary">
                Select a run to inspect the
                controlled backend tools used by
                the agent.
              </p>
            </div>

            {isFetching ? (
              <p className="text-sm text-text-secondary">
                Loading agent activity...
              </p>
            ) : runs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-soft px-4 py-10 text-center">
                <p className="text-sm text-text-secondary">
                  No agent activity has been
                  recorded yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {runs.map((run) => {
                  const isExpanded =
                    expandedRunId === run.id;

                  return (
                    <article
                      key={run.id}
                      className="overflow-hidden rounded-2xl border border-border-soft"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRunId(
                            isExpanded
                              ? null
                              : run.id,
                          )
                        }
                        className="w-full p-4 text-left transition hover:bg-soft-white sm:p-5"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-dark-green">
                                Run #{run.id}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${getOutcomeClasses(
                                  run.outcome,
                                )}`}
                              >
                                {run.outcome ??
                                  "running"}
                              </span>

                              {run.intent && (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase text-text-secondary">
                                  {run.intent}
                                </span>
                              )}
                            </div>

                            <p className="mt-3 break-words text-sm font-semibold leading-6 text-text-primary">
                              {
                                run.customer_message
                              }
                            </p>

                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-secondary">
                              <span>
                                Conversation #
                                {
                                  run.conversation_id
                                }
                              </span>

                              <span>
                                User #{run.user_id}
                              </span>

                              <span>
                                {
                                  run.tool_calls
                                    .length
                                }{" "}
                                tool call
                                {run.tool_calls
                                  .length === 1
                                  ? ""
                                  : "s"}
                              </span>

                              <span>
                                {formatDuration(
                                  run.started_at,
                                  run.completed_at,
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-3">
                            {run.escalated && (
                              <span className="rounded-lg bg-soft-yellow px-3 py-2 text-xs font-bold text-dark-green">
                                Human support
                              </span>
                            )}

                            <span className="text-lg font-bold text-dark-green">
                              {isExpanded
                                ? "−"
                                : "+"}
                            </span>
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border-soft bg-soft-white p-4 sm:p-5">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">
                                Started
                              </p>

                              <p className="mt-2 text-sm font-semibold text-text-primary">
                                {new Date(
                                  run.started_at,
                                ).toLocaleString()}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white p-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">
                                Completed
                              </p>

                              <p className="mt-2 text-sm font-semibold text-text-primary">
                                {run.completed_at
                                  ? new Date(
                                      run.completed_at,
                                    ).toLocaleString()
                                  : "Still running"}
                              </p>
                            </div>
                          </div>

                          {run.error_message && (
                            <div className="mt-4 rounded-xl bg-red-50 p-4">
                              <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                                Agent error
                              </p>

                              <p className="mt-2 break-words text-sm text-red-700">
                                {
                                  run.error_message
                                }
                              </p>
                            </div>
                          )}

                          <div className="mt-5">
                            <h4 className="font-bold text-text-primary">
                              Tool calls
                            </h4>

                            {run.tool_calls
                              .length === 0 ? (
                              <div className="mt-3 rounded-xl border border-dashed border-border-soft bg-white p-4">
                                <p className="text-sm text-text-secondary">
                                  No controlled
                                  backend tool was
                                  recorded for this
                                  run.
                                </p>
                              </div>
                            ) : (
                              <div className="mt-3 space-y-3">
                                {run.tool_calls.map(
                                  (toolCall) => (
                                    <div
                                      key={
                                        toolCall.id
                                      }
                                      className="rounded-xl border border-border-soft bg-white p-4"
                                    >
                                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                          <p className="break-all font-bold text-dark-green">
                                            {
                                              toolCall.tool_name
                                            }
                                          </p>

                                          <p className="mt-1 text-xs text-text-secondary">
                                            {toolCall.duration_ms !==
                                            null
                                              ? `${toolCall.duration_ms} ms`
                                              : "Duration unavailable"}
                                          </p>
                                        </div>

                                        <span
                                          className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
                                            toolCall.success
                                              ? "bg-light-green text-dark-green"
                                              : "bg-red-50 text-red-700"
                                          }`}
                                        >
                                          {toolCall.success
                                            ? "Success"
                                            : "Failed"}
                                        </span>
                                      </div>

                                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                        <div>
                                          <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">
                                            Input
                                          </p>

                                          <p className="mt-1 break-words text-sm leading-6 text-text-primary">
                                            {toolCall.input_summary ??
                                              "No input summary"}
                                          </p>
                                        </div>

                                        <div>
                                          <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">
                                            Output
                                          </p>

                                          <p className="mt-1 break-words text-sm leading-6 text-text-primary">
                                            {toolCall.output_summary ??
                                              "No output summary"}
                                          </p>
                                        </div>
                                      </div>

                                      {toolCall.error_message && (
                                        <div className="mt-3 rounded-lg bg-red-50 p-3">
                                          <p className="break-words text-sm text-red-700">
                                            {
                                              toolCall.error_message
                                            }
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  ),
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}