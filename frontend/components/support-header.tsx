"use client";

import { useRouter } from "next/navigation";

type SupportHeaderProps = {
  onMenuClick: () => void;
  userName: string;
};

export default function SupportHeader({
  onMenuClick,
  userName,
}: SupportHeaderProps) {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("access_token");
    router.replace("/");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border-soft bg-white">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl border border-border-soft px-3 py-2 font-bold text-dark-green lg:hidden"
          >
            ☰
          </button>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-dark-green">
              Support portal
            </p>

            <p className="truncate text-sm font-bold text-text-primary sm:text-base">
              {userName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl bg-dark-green px-4 py-2 text-sm font-bold text-white transition hover:bg-deep-green"
        >
          Logout
        </button>
      </div>
    </header>
  );
}