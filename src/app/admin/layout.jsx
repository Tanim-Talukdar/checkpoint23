import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/requireAdmin";

export default async function AdminLayout({ children }) {
  const { authenticated } = await requireAdmin();

  if (!authenticated) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#050A14] text-white">
      <AdminSidebar />

      <main className="min-h-screen lg:pl-64">
        {children}
      </main>
    </div>
  );
}