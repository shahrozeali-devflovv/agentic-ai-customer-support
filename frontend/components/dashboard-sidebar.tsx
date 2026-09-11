"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type DashboardSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Orders",
    href: "/orders",
  },
  {
    label: "Conversations",
    href: "/conversations",
  },
  {
    label: "Profile",
    href: "/profile",
  },
];

export default function DashboardSidebar({
  isOpen,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-dark-green px-5 py-6 text-white transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={onClose}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow text-lg font-bold text-dark-green">
              A
            </div>

            <div>
              <p className="font-semibold">
                Agentic Support
              </p>

              <p className="text-xs text-white/60">
                Customer Portal
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            ×
          </button>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "bg-yellow text-dark-green"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-2xl bg-white/10 p-4">
          <p className="text-sm font-semibold">
            Need help?
          </p>

          <p className="mt-1 text-xs leading-5 text-white/60">
            Start a support conversation and we&apos;ll help you find what you need.
          </p>

          <Link
            href="/conversations"
            onClick={onClose}
            className="mt-4 block rounded-xl bg-yellow px-4 py-2.5 text-center text-sm font-bold text-dark-green transition hover:bg-yellow-hover"
          >
            Get support
          </Link>
        </div>
      </aside>
    </>
  );
}