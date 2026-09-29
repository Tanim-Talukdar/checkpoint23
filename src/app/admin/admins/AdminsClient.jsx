"use client";

import { useState } from "react";
import {
  FiPlus,
  FiUserCheck,
  FiUserX,
  FiX,
} from "react-icons/fi";

export default function AdminsClient({
  initialAdmins,
}) {
  const [admins, setAdmins] = useState(
    initialAdmins || []
  );

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleAddAdmin(event) {
    event.preventDefault();

    setSaving(true);

    try {
      const response = await fetch("/api/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to create admin"
        );
        return;
      }

      setAdmins((prev) => [
        data.admin,
        ...prev,
      ]);

      setForm({
        name: "",
        email: "",
        password: "",
      });

      setShowAddModal(false);
    } catch {
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAdmin(admin) {
    const newStatus = !admin.isActive;

    try {
      const response = await fetch(
        `/api/admins/${admin._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to update admin"
        );
        return;
      }

      setAdmins((prev) =>
        prev.map((item) =>
          item._id === admin._id
            ? {
                ...item,
                isActive: data.admin.isActive,
              }
            : item
        )
      );
    } catch {
      alert("Something went wrong");
    }
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* HEADER */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">
            Admin Management
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Manage administrator accounts
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium transition hover:bg-blue-500"
        >
          <FiPlus size={18} />

          Add Admin
        </button>
      </div>

      {/* ADMIN TABLE */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#07101c]/80">
        {admins.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No admins found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-white/[0.08]">
                <tr className="text-sm text-slate-400">
                  <th className="px-6 py-4">
                    Name
                  </th>

                  <th className="px-6 py-4">
                    Email
                  </th>

                  <th className="px-6 py-4">
                    Type
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {admins.map((admin) => (
                  <tr
                    key={admin._id}
                    className="border-b border-white/[0.06] last:border-0"
                  >
                    {/* NAME */}
                    <td className="px-6 py-5 font-medium">
                      {admin.name}
                    </td>

                    {/* EMAIL */}
                    <td className="px-6 py-5 text-sm text-slate-400">
                      {admin.email}
                    </td>

                    {/* TYPE */}
                    <td className="px-6 py-5">
                      {admin.adminLevel ===
                      "main" ? (
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                          Main Admin
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs text-slate-400">
                          Moderator
                        </span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-5">
                      {admin.isActive ? (
                        <span className="inline-flex items-center gap-2 text-sm text-green-400">
                          <span className="h-2 w-2 rounded-full bg-green-400" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 text-sm text-red-400">
                          <span className="h-2 w-2 rounded-full bg-red-400" />
                          Disabled
                        </span>
                      )}
                    </td>

                    {/* ACTION */}
                    <td className="px-6 py-5 text-right">
                      {admin.adminLevel ===
                      "main" ? (
                        <span className="text-xs text-slate-600">
                          Protected
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            toggleAdmin(admin)
                          }
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                            admin.isActive
                              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          }`}
                        >
                          {admin.isActive ? (
                            <>
                              <FiUserX
                                size={15}
                              />

                              Disable
                            </>
                          ) : (
                            <>
                              <FiUserCheck
                                size={15}
                              />

                              Enable
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD ADMIN MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#07101c] p-6 shadow-2xl">
            {/* MODAL HEADER */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  Add Admin
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a moderator account
                </p>
              </div>

              <button
                onClick={() =>
                  setShowAddModal(false)
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleAddAdmin}
              className="space-y-4"
            >
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-500"
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-500"
              />

              <input
                type="password"
                name="password"
                placeholder="Password (minimum 8 characters)"
                value={form.password}
                onChange={handleChange}
                minLength={8}
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-slate-600 focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Creating..."
                  : "Create Admin"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}