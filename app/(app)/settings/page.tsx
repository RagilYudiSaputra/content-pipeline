"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Save,
  Loader2,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Users,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: "admin" | "designer" | "user";
  avatar?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function SettingsPage() {
 const { user, profile, setProfile } = useAuth();

  // --- STATE PROFIL DIRI ---
  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // --- STATE MANAJEMEN USER (ADMIN ONLY) ---
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "designer",
  });
  const [submittingUser, setSubmittingUser] = useState(false);
  const [userManagementMessage, setUserManagementMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isAdmin = profile?.role === "admin";

  // Load nama profil pengguna yang login
  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
    }
  }, [profile]);

  // Fetch daftar pengguna secara realtime menggunakan koleksi "users"
  useEffect(() => {
    if (!isAdmin) return;

    setLoadingUsers(true);
    const usersCollection = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersCollection,
      (snapshot) => {
        const list: UserItem[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<UserItem, "id">),
        }));
        setUsersList(list);
        setLoadingUsers(false);
      },
      (error) => {
        console.error("Gagal mengambil daftar user:", error);
        setLoadingUsers(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  // Handle Simpan Profil Diri ke koleksi "users"
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          fullName: fullName,
          email: user.email,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setProfile((prev) =>
  prev
    ? {
        ...prev,
        fullName,
      }
    : prev
);

      setProfileMessage({ type: "success", text: "Profil berhasil diperbarui!" });
    } catch (error: any) {
      console.error("Gagal menyimpan profil:", error);
      setProfileMessage({
        type: "error",
        text: error.message || "Gagal menyimpan perubahan. Coba lagi.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // --- LOGIC MANAJEMEN USER (ADMIN) ---

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const matchesSearch =
        u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [usersList, searchQuery, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({ fullName: "", email: "", password: "", role: "designer" });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: UserItem) => {
    setEditingUser(u);
    setFormData({ fullName: u.fullName, email: u.email, password: "", role: u.role });
    setIsModalOpen(true);
  };

  // Submit Form User (Tambah / Edit)
  const handleSubmitUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingUser(true);
    setUserManagementMessage(null);

    try {
      if (editingUser) {
        // Mode Edit: Update dokumen di koleksi "users"
        const targetRef = doc(db, "users", editingUser.id);
        await updateDoc(targetRef, {
          fullName: formData.fullName,
          role: formData.role,
          updatedAt: serverTimestamp(),
        });
        setUserManagementMessage({
          type: "success",
          text: "Data pengguna berhasil diperbarui!",
        });
      } else {
        // Mode Tambah: Panggil API Backend
        const response = await fetch("/api/users/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            role: formData.role,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal membuat pengguna baru");
        }

        setUserManagementMessage({
          type: "success",
          text: "Pengguna baru berhasil dibuat!",
        });
      }

      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Gagal menyimpan data user:", error);
      setUserManagementMessage({
        type: "error",
        text: error.message || "Terjadi kesalahan saat menyimpan data.",
      });
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string, email: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${name}"?`)) {
      try {
        const response = await fetch("/api/users/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: id, email: email }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Gagal menghapus pengguna");
        }

        setUserManagementMessage({
          type: "success",
          text: "Pengguna berhasil dihapus dari Auth dan Firestore.",
        });
      } catch (error: any) {
        console.error("Gagal menghapus user:", error);
        setUserManagementMessage({
          type: "error",
          text: error.message || "Gagal menghapus pengguna.",
        });
      }
    }
  };

  const initials =
    fullName
      ?.split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .join("")
      .substring(0, 2)
      .toUpperCase() || "U";

  return (
    <div className="flex h-full w-full flex-col justify-start p-4 md:p-6 overflow-y-auto space-y-6">
      {/* 1. CARD PROFIL PENGGUNA */}
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Profil Pengguna
            </h2>
            <p className="text-xs text-slate-500">
              Perbarui informasi profil Anda di bawah ini.
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700 border border-blue-100 capitalize">
            Role: {profile?.role || "user"}
          </span>
        </div>

        {profileMessage && (
          <div
            className={`mb-4 rounded-xl p-3 text-xs font-medium ${
              profileMessage.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {profileMessage.text}
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <Avatar className="h-14 w-14 shrink-0 border border-slate-200 shadow-sm">
              <AvatarFallback className="bg-blue-600 text-base font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div>
              <p className="text-xs font-semibold text-slate-800">
                Avatar Inisial
              </p>
              <p className="text-[11px] text-slate-500">
                Avatar Anda secara otomatis menggunakan inisial nama lengkap Anda.
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Email Akun
            </label>
            <input
              type="text"
              value={user?.email || ""}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs text-slate-400"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masukkan nama lengkap Anda"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {savingProfile ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={15} />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. KHUSUS ADMIN: MODUL MANAJEMEN USER */}
      {isAdmin && (
        <div className="w-full max-w-4xl rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                <h2 className="text-base font-semibold text-slate-900">
                  Manajemen Pengguna
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Kelola daftar akun, pendaftaran, dan hak akses pengguna sistem.
              </p>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 self-start rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 cursor-pointer sm:self-auto"
            >
              <Plus size={15} />
              <span>Tambah User Baru</span>
            </button>
          </div>

          {userManagementMessage && (
            <div
              className={`mb-4 rounded-xl p-3 text-xs font-medium ${
                userManagementMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {userManagementMessage.text}
            </div>
          )}

          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              <option value="all">Semua Role</option>
              <option value="admin">Admin</option>
              <option value="designer">Designer</option>
              <option value="user">User</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      <Loader2 size={18} className="mx-auto animate-spin mb-1" />
                      <span>Memuat data pengguna...</span>
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Tidak ada data pengguna ditemukan.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {u.fullName || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                            u.role === "admin"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : u.role === "designer"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.role === "admin" && <ShieldCheck size={12} />}
                          {u.role || "user"}
                        </span>
                      </td>
                     <td className="px-4 py-3 text-right">
  <div className="flex items-center justify-end gap-1">
    {/* Tombol Edit */}
    <button
      onClick={() => handleOpenEditModal(u)}
      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition"
      title="Edit User"
    >
      <Edit2 size={14} />
    </button>

    {/* Tombol Hapus */}
    <button
      onClick={() => handleDeleteUser(u.id, u.fullName, u.email)}
      className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
      title="Hapus User"
    >
      <Trash2 size={14} />
    </button>
  </div>
</td> 
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loadingUsers && filteredUsers.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <div>
                Menampilkan{" "}
                <span className="font-medium text-slate-800">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{" "}
                -{" "}
                <span className="font-medium text-slate-800">
                  {Math.min(currentPage * itemsPerPage, filteredUsers.length)}
                </span>{" "}
                dari{" "}
                <span className="font-medium text-slate-800">
                  {filteredUsers.length}
                </span>{" "}
                pengguna
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-2 font-medium text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. MODAL / POPUP (TAMBAH / EDIT USER) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                {editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitUserForm} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="Contoh: Alex Rivers"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Email Akun
                </label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Password Awal
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  Hak Akses / Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as any })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="designer">Designer</option>
                  <option value="admin">Admin</option>
                  <option value="user">User Biasa</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {submittingUser ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingUser ? "Simpan Perubahan" : "Tambah User"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}