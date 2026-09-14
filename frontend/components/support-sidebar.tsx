"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SupportSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const navigation = [
  {
    name: "Dashboard",
    href: "/support",
  },
  {
    name: "Assigned Escalations",
    href: "/support/escalations",
  },
];

export default function SupportSidebar({
  isOpen,
  onClose,
}: SupportSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-dark-green text-white transition-transform duration-200 lg:translate-x-0 ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-yellow">
              Support Portal
            </p>

            <h1 className="mt-2 text-xl font-bold">
              Customer Support
            </h1>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/support" &&
                  pathname.startsWith(item.href));

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
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}