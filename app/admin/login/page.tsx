import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata = { title: "Admin login" };

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="flex flex-col items-center">
        <h1 className="serif text-2xl mb-1">Florinsta Admin</h1>
        <p className="text-sm text-ink-soft mb-8">Sign in to manage orders, products and inventory.</p>
        <Suspense>
          <AdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
