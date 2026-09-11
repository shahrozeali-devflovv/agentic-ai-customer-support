"use client";

import { useRouter } from "next/navigation";

type DashboardHeaderProps = {
  onMenuClick: () => void;
  userName?: string;
};

export default function DashboardHeader({
  onMenuClick,
  userName = "Customer",
}: DashboardHeaderProps) {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("access_token");
    router.replace("/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border-soft bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-soft bg-white text-xl text-dark-green transition hover:bg-soft-yellow lg:hidden"
          >
            ☰
          </button>

          <div className="min-w-0">
            <p className="text-xs text-text-secondary sm:text-sm">
              Welcome back
            </p>

            <h1 className="truncate text-base font-bold text-text-primary sm:text-xl">
              {userName}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-border-soft bg-white text-lg transition hover:bg-soft-yellow sm:flex"
          >
            🔔
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dark-green font-bold text-white">
            {userName.charAt(0).toUpperCase()}
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-border-soft bg-white px-3 py-2 text-sm font-semibold text-dark-green transition hover:border-dark-green hover:bg-soft-yellow sm:px-4"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}