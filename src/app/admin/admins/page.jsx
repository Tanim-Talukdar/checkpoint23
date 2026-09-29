import { notFound } from "next/navigation";

import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/admin";
import { requireAdmin } from "@/lib/requireAdmin";

import AdminsClient from "./AdminsClient";

export default async function AdminsPage() {
  const auth = await requireAdmin();

  // Not logged in
  if (!auth.authenticated) {
    notFound();
  }

  // Only main admin can access this page
  if (auth.admin.adminLevel !== "main") {
    notFound();
  }

  try {
    await connectDB();

    const admins = await Admin.find({})
      .select(
        "_id name email role adminLevel isActive createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    const serializedAdmins = admins.map((admin) => ({
      _id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
      adminLevel: admin.adminLevel,
      isActive: admin.isActive,
      createdAt: admin.createdAt
        ? admin.createdAt.toISOString()
        : null,
    }));

    return (
      <AdminsClient initialAdmins={serializedAdmins} />
    );
  } catch (error) {
    console.error("Admin page error");

    return (
      <div className="min-h-screen p-6 lg:p-8">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
          <h1 className="text-lg font-semibold text-red-400">
            Unable to load admin management
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Please try again later.
          </p>
        </div>
      </div>
    );
  }
}