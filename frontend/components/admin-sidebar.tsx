"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AdminSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const navigationItems = [
  {
    label: "Dashboard",
    href: "/admin",
  },
  {
    label: "Users",
    href: "/admin/users",
  },
  {
    label: "Conversations",
    href: "/admin/conversations",
  },
  {
    label: "Escalations",
    href: "/admin/escalations",
  },
  {
    label: "Knowledge Base",
    href: "/admin/knowledge-base",
  },
  {
    label: "Agent Activity",
    href: "/admin/agent-activity",
  },
];

export default function AdminSidebar({
  isOpen,
  onClose,
}: AdminSidebarProps) {
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
          isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="mb-10 flex items-center justify-between">
          <Link
            href="/admin"
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
                Admin Portal
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-white/70 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            ×
          </button>
        </div>

        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(
                    item.href,
                  );

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
            Admin workspace
          </p>

          <p className="mt-1 text-xs leading-5 text-white/60">
            Manage users, support conversations,
            escalations, and AI support operations.
          </p>
        </div>
      </aside>
    </>
  );
}