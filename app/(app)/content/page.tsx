"use client";

import { useEffect, useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Hash,
  FileCheck2,
} from "lucide-react";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/auth-provider";

interface ContentItem {
  id: string;
  title: string;
  platform: string;
  contentType: string;
  audience: string;
  status: "Published" | "Draft" | "Revisi" | "Approval";
  createdDate: string;
  rawCreatedDate?: string;
  publishDate: string;
  rawPublishDate?: string;
  fileUrl: string;
  caption: string;
  hashtag: string;
  revision: string;
}

// ----------------------------------------------------------------------
// HELPER AUDIT LOG AKTIVITAS DETAILED
// ----------------------------------------------------------------------
async function logActivity(
  userName: string,
  action: string,
  targetTitle: string,
  color: string
) {
  try {
    await addDoc(collection(db, "activity_logs"), {
      userName: userName || "Administrator",
      action,
      targetTitle: targetTitle || "Konten",
      timestamp: serverTimestamp(),
      color,
      isRead: false, // Menandai notifikasi baru belum dibaca
    });
  } catch (error) {
    console.error("Gagal mencatat log aktivitas:", error);
  }
}

// Membandingkan field lama dan baru untuk mendeteksi perubahan mendalam
function getChangedFieldsText(
  oldData: ContentItem,
  newData: {
    title: string;
    platform: string;
    contentType: string;
    audience: string;
    status: string;
    fileUrl: string;
    caption: string;
    hashtag: string;
    revision: string;
    createdDate: string;
    publishDate: string;
  }
) {
  const changes: string[] = [];

  if (oldData.title !== newData.title) changes.push("Judul");
  if (oldData.platform !== newData.platform) changes.push("Platform");
  if (oldData.contentType !== newData.contentType) changes.push("Jenis Konten");
  if (oldData.audience !== newData.audience) changes.push("Audience");
  if (oldData.status !== newData.status) changes.push(`Status (${newData.status})`);
  if ((oldData.rawCreatedDate || "") !== (newData.createdDate || "")) changes.push("Tanggal Dibuat");
  if ((oldData.rawPublishDate || "") !== (newData.publishDate || "")) changes.push("Tanggal Posting");
  if ((oldData.fileUrl || "") !== (newData.fileUrl || "")) changes.push("Link File");
  if ((oldData.caption || "") !== (newData.caption || "")) changes.push("Caption");
  if ((oldData.hashtag || "") !== (newData.hashtag || "")) changes.push("Hashtag");
  if ((oldData.revision || "") !== (newData.revision || "")) changes.push("Catatan Revisi");

  if (changes.length === 0) return "memperbarui data pada";
  return `mengubah [${changes.join(", ")}] pada`;
}

// Helper Format Role Nama Tampilan
function formatUserRole(role?: string) {
  if (!role) return "Administrator";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

// Helper Mapping Urutan Status
function getStatusPriority(status: string): number {
  switch (status) {
    case "Draft":
      return 1;
    case "Revisi":
      return 2;
    case "Approval":
      return 3;
    case "Published":
      return 4;
    default:
      return 5;
  }
}

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export default function ContentPage() {
  const { profile } = useAuth();
  const isDesigner = profile?.role === "designer";

  const [contentData, setContentData] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // State Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("Semua Platform");
  const [filterType, setFilterType] = useState("Semua Jenis");
  const [filterAudience, setFilterAudience] = useState("Semua Audience");
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [filterDate, setFilterDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // State Modals
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [viewDetailModal, setViewDetailModal] = useState<{
    open: boolean;
    title: string;
    content: string;
  }>({
    open: false,
    title: "",
    content: "",
  });

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    id: string | null;
    title: string;
  }>({
    open: false,
    id: null,
    title: "",
  });

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    platform: "Instagram",
    contentType: "Carousel",
    audience: "Mahasiswa",
    status: "Draft",
    createdDate: new Date().toISOString().split("T")[0],
    publishDate: new Date().toISOString().split("T")[0],
    fileUrl: "",
    caption: "",
    hashtag: "",
    revision: "-",
  });

  // Fetch Data dari Firestore
  async function fetchContents() {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "contents"));

      const data: ContentItem[] = snapshot.docs.map((docSnap) => {
        const item = docSnap.data();

        const cDateObj = item.createdDate?.toDate
          ? item.createdDate.toDate()
          : item.createdDate
          ? new Date(item.createdDate)
          : null;
        const pDateObj = item.publishDate?.toDate
          ? item.publishDate.toDate()
          : item.publishDate
          ? new Date(item.publishDate)
          : null;

        const rawCDate = cDateObj ? cDateObj.toISOString().split("T")[0] : "";
        const rawPDate = pDateObj ? pDateObj.toISOString().split("T")[0] : "";

        return {
          id: docSnap.id,
          title: item.title ?? "",
          platform: item.platform ?? "",
          contentType: item.contentType ?? "",
          audience: item.audience ?? "",
          status: item.status ?? "Draft",
          createdDate: cDateObj ? cDateObj.toLocaleDateString("id-ID") : "-",
          rawCreatedDate: rawCDate,
          publishDate: pDateObj ? pDateObj.toLocaleDateString("id-ID") : "-",
          rawPublishDate: rawPDate,
          fileUrl: item.fileUrl ?? "",
          caption: item.caption ?? "",
          hashtag: item.hashtag ?? "",
          revision: item.revision ?? "-",
        };
      });

      // Pengurutan Kustom:
      // 1. Berdasarkan prioritas status (Draft -> Revisi -> Approval -> Published)
      // 2. Berdasarkan tanggal dibuat paling muda (ascending / terlama ke terbaru atau sebaliknya, sesuai instruksi "paling muda" / tanggal terkecil duluan)
      data.sort((a, b) => {
        const priorityA = getStatusPriority(a.status);
        const priorityB = getStatusPriority(b.status);

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        const dateA = a.rawCreatedDate ? new Date(a.rawCreatedDate).getTime() : 0;
        const dateB = b.rawCreatedDate ? new Date(b.rawCreatedDate).getTime() : 0;

        return dateA - dateB;
      });

      setContentData(data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContents();
  }, []);

  // Filter & Search Logic
  const filteredContents = useMemo(() => {
    return contentData.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.hashtag.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlatform =
        filterPlatform === "Semua Platform" || item.platform === filterPlatform;
      const matchesType =
        filterType === "Semua Jenis" || item.contentType === filterType;
      const matchesAudience =
        filterAudience === "Semua Audience" || item.audience === filterAudience;
      const matchesStatus =
        filterStatus === "Semua Status" || item.status === filterStatus;

      const matchesDate =
        filterDate === "" || item.rawCreatedDate === filterDate;

      return (
        matchesSearch &&
        matchesPlatform &&
        matchesType &&
        matchesAudience &&
        matchesStatus &&
        matchesDate
      );
    });
  }, [
    contentData,
    searchQuery,
    filterPlatform,
    filterType,
    filterAudience,
    filterStatus,
    filterDate,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    filterPlatform,
    filterType,
    filterAudience,
    filterStatus,
    filterDate,
  ]);

  const totalPages = Math.ceil(filteredContents.length / ITEMS_PER_PAGE) || 1;

  const paginatedContents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredContents.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredContents, currentPage]);

  const handleResetFilter = () => {
    setSearchQuery("");
    setFilterPlatform("Semua Platform");
    setFilterType("Semua Jenis");
    setFilterAudience("Semua Audience");
    setFilterStatus("Semua Status");
    setFilterDate("");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Modal Handlers
  const handleOpenAddModal = () => {
    setEditingId(null);
    const todayStr = new Date().toISOString().split("T")[0];
    setFormData({
      title: "",
      platform: "Instagram",
      contentType: "Carousel",
      audience: "Mahasiswa",
      status: "Draft",
      createdDate: todayStr,
      publishDate: todayStr,
      fileUrl: "",
      caption: "",
      hashtag: "",
      revision: "-",
    });
    setOpenModal(true);
  };

  const handleOpenEditModal = (item: ContentItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      platform: item.platform || "Instagram",
      contentType: item.contentType || "Carousel",
      audience: item.audience || "Mahasiswa",
      status: item.status || "Draft",
      createdDate: item.rawCreatedDate || new Date().toISOString().split("T")[0],
      publishDate: item.rawPublishDate || new Date().toISOString().split("T")[0],
      fileUrl: item.fileUrl,
      caption: item.caption,
      hashtag: item.hashtag,
      revision: item.revision,
    });
    setOpenModal(true);
  };

  // Simpan Data & Pemicu Notifikasi
  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert("Judul konten wajib diisi!");
      return;
    }

    const currentUserRole = formatUserRole(profile?.role);

    try {
      const payload: Record<string, unknown> = {
        title: formData.title,
        platform: formData.platform,
        contentType: formData.contentType,
        audience: formData.audience,
        status: formData.status,
        createdDate: formData.createdDate ? Timestamp.fromDate(new Date(formData.createdDate)) : serverTimestamp(),
        publishDate: formData.publishDate ? Timestamp.fromDate(new Date(formData.publishDate)) : serverTimestamp(),
        fileUrl: formData.fileUrl,
        caption: formData.caption,
        hashtag: formData.hashtag,
      };

      if (!isDesigner) {
        payload.revision = formData.revision;
      }

      if (editingId) {
        // EDIT KONTEN
        const oldItem = contentData.find((item) => item.id === editingId);

        const docRef = doc(db, "contents", editingId);
        await updateDoc(docRef, payload);

        let actionText = "mengedit konten";
        if (oldItem) {
          actionText = getChangedFieldsText(oldItem, formData);
        }

        let color = "bg-blue-500";
        if (formData.status === "Published") color = "bg-emerald-500";
        else if (formData.status === "Approval") color = "bg-sky-500";
        else if (formData.status === "Revisi") color = "bg-violet-500";
        else if (formData.status === "Draft") color = "bg-amber-500";

        await logActivity(currentUserRole, actionText, `"${formData.title}"`, color);
      } else {
        // TAMBAH KONTEN BARU
        if (isDesigner) payload.revision = "-";

        await addDoc(collection(db, "contents"), payload);

        await logActivity(
          currentUserRole,
          "menambahkan konten baru",
          `"${formData.title}"`,
          "bg-emerald-500"
        );
      }

      setOpenModal(false);
      fetchContents();
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
    }
  };

  // Hapus Data & Pemicu Notifikasi
  const handleDelete = async () => {
    if (!deleteModal.id) return;
    const currentUserRole = formatUserRole(profile?.role);

    try {
      await deleteDoc(doc(db, "contents", deleteModal.id));

      await logActivity(
        currentUserRole,
        "menghapus konten",
        `"${deleteModal.title}"`,
        "bg-red-500"
      );

      setDeleteModal({ open: false, id: null, title: "" });
      fetchContents();
    } catch (error) {
      console.error("Gagal menghapus data:", error);
    }
  };

  const handleOpenDetail = (title: string, content: string) => {
    setViewDetailModal({
      open: true,
      title,
      content: content.trim() ? content : "Tidak ada data.",
    });
  };

  if (loading) {
    return (
      <div className="flex h-[350px] items-center justify-center text-xs text-slate-400">
        Memuat data...
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-full overflow-hidden text-xs">
      {/* Header Search & CTA */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            placeholder="Cari judul, caption, hashtag..."
            className="h-8 pl-8 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button className="h-8 px-3 text-xs" onClick={handleOpenAddModal}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Buat Konten Baru
        </Button>
      </div>

      {/* Filter Row Compact */}
      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option>Semua Platform</option>
            <option>Instagram</option>
            <option>TikTok</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option>Semua Jenis</option>
            <option>Carousel</option>
            <option>Video</option>
            <option>Gambar Tunggal</option>
          </select>

          <select
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value)}
            className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option>Semua Audience</option>
            <option>Mahasiswa</option>
            <option>Dosen</option>
            <option>Guru</option>
            <option>Peneliti</option>
            <option>Penulis Pemula</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option>Semua Status</option>
            <option>Draft</option>
            <option>Revisi</option>
            <option>Approval</option>
            <option>Published</option>
          </select>

          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-7 text-[11px] px-2"
          />

          <Button
            variant="outline"
            className="h-7 text-[11px] px-2"
            onClick={handleResetFilter}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        </div>
      </div>

      {/* Table Konten */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-2xs overflow-hidden">
        <table className="w-full text-left table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-500">
              <th className="w-[18%] px-3 py-2">Judul Konten</th>
              <th className="w-[9%] px-2 py-2">Platform</th>
              <th className="w-[9%] px-2 py-2">Jenis</th>
              <th className="w-[9%] px-2 py-2">Audience</th>
              <th className="w-[9%] px-2 py-2 text-center">Status</th>

              <th className="w-[9%] px-1.5 py-2">Tgl Dibuat</th>
              <th className="w-[9%] px-1.5 py-2">Tgl Posting</th>

              <th className="w-[6%] px-1 py-2 text-center">Link</th>
              <th className="w-[6%] px-1 py-2 text-center">Caption</th>
              <th className="w-[6%] px-1 py-2 text-center">Hashtag</th>
              <th className="w-[6%] px-1 py-2 text-center">Revisi</th>

              <th className="w-[6%] px-2 py-2 text-right pr-3">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-[11px]">
            {paginatedContents.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-6 text-center text-slate-400">
                  {contentData.length === 0
                    ? "Belum ada data konten."
                    : "Data tidak ditemukan."}
                </td>
              </tr>
            ) : (
              paginatedContents.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-3 py-1.5 font-medium text-slate-800 truncate" title={item.title}>
                    {item.title}
                  </td>
                  <td className="px-2 py-1.5 text-slate-600 truncate">{item.platform}</td>
                  <td className="px-2 py-1.5 text-slate-500 truncate">{item.contentType}</td>
                  <td className="px-2 py-1.5 text-slate-500 truncate">{item.audience}</td>

                  {/* Status Badge */}
                  <td className="px-2 py-1.5 text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-medium ${
                        item.status === "Published"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : item.status === "Draft"
                          ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                          : item.status === "Approval"
                          ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                          : "bg-violet-50 text-violet-700 border border-violet-200/60"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-1.5 py-1.5 text-slate-500 whitespace-nowrap text-[10px]">
                    {item.createdDate}
                  </td>

                  <td className="px-1.5 py-1.5 text-slate-500 whitespace-nowrap text-[10px]">
                    {item.publishDate}
                  </td>

                  {/* Link File */}
                  <td className="px-1 py-1.5 text-center">
                    {item.fileUrl ? (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Buka Link File"
                      >
                        <ExternalLink size={13} />
                      </a>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>

                  {/* Caption */}
                  <td className="px-1 py-1.5 text-center">
                    <button
                      onClick={() => handleOpenDetail(`Caption - ${item.title}`, item.caption)}
                      className="inline-flex items-center justify-center p-1 text-slate-600 hover:bg-slate-100 rounded"
                      title="Lihat Caption"
                    >
                      <MessageSquare size={13} />
                    </button>
                  </td>

                  {/* Hashtag */}
                  <td className="px-1 py-1.5 text-center">
                    <button
                      onClick={() => handleOpenDetail(`Hashtag - ${item.title}`, item.hashtag)}
                      className="inline-flex items-center justify-center p-1 text-slate-600 hover:bg-slate-100 rounded"
                      title="Lihat Hashtag"
                    >
                      <Hash size={13} />
                    </button>
                  </td>

                  {/* Revisi */}
                  <td className="px-1 py-1.5 text-center">
                    <button
                      onClick={() => handleOpenDetail(`Catatan Revisi - ${item.title}`, item.revision)}
                      className="inline-flex items-center justify-center p-1 text-slate-600 hover:bg-slate-100 rounded"
                      title="Lihat Catatan Revisi"
                    >
                      <FileCheck2 size={13} />
                    </button>
                  </td>

                  {/* Aksi */}
                  <td className="px-2 py-1.5 text-right pr-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded"
                        title="Edit Konten"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteModal({
                            open: true,
                            id: item.id,
                            title: item.title,
                          })
                        }
                        className="p-1 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded"
                        title="Hapus Konten"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-2 px-1 text-[11px] text-slate-500">
        <p>
          Data {filteredContents.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
          {Math.min(currentPage * ITEMS_PER_PAGE, filteredContents.length)} dari {filteredContents.length}
        </p>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px]"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            <ChevronLeft className="mr-0.5 h-3 w-3" /> Prev
          </Button>
          <span className="text-[10px]">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[10px]"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next <ChevronRight className="ml-0.5 h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* MODAL DETAIL */}
      {viewDetailModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-lg border border-slate-200">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-xs font-semibold text-slate-800 truncate">
                {viewDetailModal.title}
              </h3>
              <button
                onClick={() => setViewDetailModal({ open: false, title: "", content: "" })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-4 max-h-56 overflow-y-auto">
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-2.5 rounded-md border border-slate-100">
                {viewDetailModal.content}
              </p>
            </div>
            <div className="flex justify-end border-t px-4 py-2 bg-slate-50/50 rounded-b-xl">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setViewDetailModal({ open: false, title: "", content: "" })}
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DELETE CONFIRMATION */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-800">Hapus Konten</h3>
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus konten &quot;{deleteModal.title}&quot;? Action ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setDeleteModal({ open: false, id: null, title: "" })}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onClick={handleDelete}
              >
                Hapus
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT KONTEN */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-xs font-bold text-slate-800">
                {editingId ? "Edit Konten" : "Tambah Konten Baru"}
              </h2>
              <button
                onClick={() => setOpenModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto">
              {/* Judul Konten */}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">
                  Judul Konten <span className="text-red-500">*</span>
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Masukkan judul..."
                  className="h-8 text-xs"
                />
              </div>

              {/* Platform & Jenis Konten */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Platform
                  </label>
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Jenis Konten
                  </label>
                  <select
                    name="contentType"
                    value={formData.contentType}
                    onChange={handleInputChange}
                    className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Carousel">Carousel</option>
                    <option value="Video">Video</option>
                    <option value="Gambar Tunggal">Gambar Tunggal</option>
                  </select>
                </div>
              </div>

              {/* Target Audience & Status */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Target Audience
                  </label>
                  <select
                    name="audience"
                    value={formData.audience}
                    onChange={handleInputChange}
                    className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Mahasiswa">Mahasiswa</option>
                    <option value="Dosen">Dosen</option>
                    <option value="Guru">Guru</option>
                    <option value="Peneliti">Peneliti</option>
                    <option value="Penulis Pemula">Penulis Pemula</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Revisi">Revisi</option>
                    <option value="Approval">Approval</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>

              {/* Tanggal Dibuat & Tanggal Posting */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Tanggal Dibuat
                  </label>
                  <Input
                    type="date"
                    name="createdDate"
                    value={formData.createdDate}
                    onChange={handleInputChange}
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Tanggal Posting
                  </label>
                  <Input
                    type="date"
                    name="publishDate"
                    value={formData.publishDate}
                    onChange={handleInputChange}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Link File Konten */}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">
                  Link File Konten
                </label>
                <Input
                  name="fileUrl"
                  value={formData.fileUrl}
                  onChange={handleInputChange}
                  placeholder="https://drive.google.com/..."
                  className="h-8 text-xs"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">
                  Caption
                </label>
                <textarea
                  name="caption"
                  value={formData.caption}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Tulis caption..."
                  className="w-full rounded-md border border-input p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Hashtag */}
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">
                  Hashtag
                </label>
                <textarea
                  name="hashtag"
                  value={formData.hashtag}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="#hashtag..."
                  className="w-full rounded-md border border-input p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Catatan Revisi */}
              {!isDesigner && (
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Catatan Revisi
                  </label>
                  <textarea
                    name="revision"
                    value={formData.revision}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Catatan revisi..."
                    className="w-full rounded-md border border-input p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-4 py-3 bg-slate-50/50 rounded-b-xl">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setOpenModal(false)}
              >
                Batal
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}