import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  // Middleware already redirects unauthenticated requests, this is a defense-in-depth check
  // for the layout itself (e.g. if middleware matcher is ever changed).
  if (!session?.user) redirect("/admin/login");

  const role = session.user.role;

  return (
    <div className="min-h-screen flex bg-[#F7F3EC] text-ink">
      <AdminSidebar role={role} userName={session.user.name ?? session.user.email ?? "Admin"} />
      <div className="flex-1 min-w-0">
        <main className="p-6 lg:p-10 max-w-[1400px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
