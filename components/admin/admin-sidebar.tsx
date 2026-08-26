"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", roles: ["ADMIN", "STAFF"] },
  { href: "/admin/orders", label: "Orders", roles: ["ADMIN", "STAFF"] },
  { href: "/admin/products", label: "Products", roles: ["ADMIN", "STAFF"] },
  { href: "/admin/inventory", label: "Inventory", roles: ["ADMIN", "STAFF"] },
  { href: "/admin/customers", label: "Customers", roles: ["ADMIN", "STAFF"] },
  { href: "/admin/coupons", label: "Coupons", roles: ["ADMIN"] },
  { href: "/admin/reports", label: "Reports", roles: ["ADMIN"] },
  { href: "/admin/settings", label: "Settings", roles: ["ADMIN"] },
];

export function AdminSidebar({ role, userName }: { role: string; userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col bg-white border-r border-ink/10 min-h-screen">
      <div className="p-6">
        <span className="serif text-xl">Florinsta Admin</span>
        <p className="text-xs text-ink-soft mt-1">{userName} · {role}</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.filter((item) => item.roles.includes(role)).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                active ? "bg-rose-deep text-white" : "text-ink hover:bg-blush-soft"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4">
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full text-left px-4 py-3 rounded-xl text-sm text-ink-soft hover:bg-blush-soft transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
