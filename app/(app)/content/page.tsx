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
  Share2,
  Tag,
  Calendar,
  Sparkles,
  Filter,
  Layers,
  FileText,
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
      isRead: false,
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

// Helper Styling Platform Berwarna (Sesuai Dashboard)
const getPlatformStyle = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes("instagram")) {
    return "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 text-pink-700 border-pink-200/80";
  } else if (p.includes("tiktok")) {
    return "bg-slate-900/10 text-slate-900 border-slate-300";
  } else if (p.includes("youtube")) {
    return "bg-rose-500/10 text-rose-700 border-rose-200/80";
  } else if (p.includes("linkedin")) {
    return "bg-sky-500/10 text-sky-800 border-sky-200/80";
  } else if (p.includes("twitter") || p.includes("x")) {
    return "bg-blue-500/10 text-blue-700 border-blue-200/80";
  }
  return "bg-indigo-500/10 text-indigo-700 border-indigo-200/80";
};

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
          createdDate: cDateObj ? cDateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-",
          rawCreatedDate: rawCDate,
          publishDate: pDateObj ? pDateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-",
          rawPublishDate: rawPDate,
          fileUrl: item.fileUrl ?? "",
          caption: item.caption ?? "",
          hashtag: item.hashtag ?? "",
          revision: item.revision ?? "-",
        };
      });

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

      // DISESUAIKAN: Menggunakan rawPublishDate untuk pencocokan tanggal posting
      const matchesDate =
        filterDate === "" || item.rawPublishDate === filterDate;

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
        const oldItem = contentData.find((item) => item.id === editingId);

        const docRef = doc(db, "contents", editingId);
        await updateDoc(docRef, payload);

        let actionText = "mengedit konten";
        if (oldItem) {
          actionText = getChangedFieldsText(oldItem, formData);
        }

        let color = "bg-blue-500 shadow-blue-500/50";
        if (formData.status === "Published") color = "bg-emerald-500 shadow-emerald-500/50";
        else if (formData.status === "Approval") color = "bg-sky-500 shadow-sky-500/50";
        else if (formData.status === "Revisi") color = "bg-violet-500 shadow-violet-500/50";
        else if (formData.status === "Draft") color = "bg-amber-500 shadow-amber-500/50";

        await logActivity(currentUserRole, actionText, `"${formData.title}"`, color);
      } else {
        if (isDesigner) payload.revision = "-";

        await addDoc(collection(db, "contents"), payload);

        await logActivity(
          currentUserRole,
          "menambahkan konten baru",
          `"${formData.title}"`,
          "bg-emerald-500 shadow-emerald-500/50"
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
        "bg-red-500 shadow-red-500/50"
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
      <div className="flex h-[320px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-sm">
        <div className="relative flex items-center justify-center">
          <div className="h-10 w-10 animate-ping rounded-full bg-blue-400/20" />
          <Sparkles className="absolute h-6 w-6 animate-spin text-blue-600" />
        </div>
        <p className="text-xs font-semibold text-slate-500">Memuat Data Konten...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 max-w-full overflow-hidden text-xs pb-2">
      
      {/* 1. HEADER CONTROL BAR (SEARCH & CREATION) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <Input
            placeholder="Cari judul, caption, hashtag..."
            className="h-8 pl-8 text-xs rounded-xl border-slate-200/80 bg-slate-50/50 focus:bg-white transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button 
          className="w-full sm:w-auto h-8 px-3.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition-all duration-200"
          onClick={handleOpenAddModal}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Buat Konten Baru
        </Button>
      </div>

      {/* 2. FILTER ROW MODERN */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
        <div className="flex items-center gap-1.5 mb-2.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
          <Filter className="h-3 w-3 text-blue-600" />
          <span>Filter Konten</span>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="h-8 rounded-xl border border-slate-200/80 bg-slate-50/50 px-2.5 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          >
            <option>Semua Platform</option>
            <option>Instagram</option>
            <option>TikTok</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-8 rounded-xl border border-slate-200/80 bg-slate-50/50 px-2.5 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          >
            <option>Semua Jenis</option>
            <option>Carousel</option>
            <option>Video</option>
            <option>Gambar Tunggal</option>
          </select>

          <select
            value={filterAudience}
            onChange={(e) => setFilterAudience(e.target.value)}
            className="h-8 rounded-xl border border-slate-200/80 bg-slate-50/50 px-2.5 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
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
            className="h-8 rounded-xl border border-slate-200/80 bg-slate-50/50 px-2.5 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
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
            className="h-8 text-[11px] px-2.5 rounded-xl border-slate-200/80 bg-slate-50/50 font-medium"
          />

          <Button
            variant="outline"
            className="h-8 text-[11px] font-bold px-2.5 rounded-xl border-slate-200 hover:bg-slate-100 text-slate-600 transition-all"
            onClick={handleResetFilter}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        </div>
      </div>

      {/* 3. TABLE KONTEN MODERN (GAYA DASHBOARD) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        
        {/* Header Section Tabel */}
        <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 bg-gradient-to-r from-blue-50/50 via-slate-50/60 to-purple-50/40">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 p-1.5 text-white shadow-xs">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[12px] font-bold text-slate-900">Daftar Kelola Konten</h2>
              <p className="text-[9px] font-medium text-slate-500">Manajemen status, media, dan rincian konten</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs">
            Total: {filteredContents.length} Konten
          </span>
        </div>

        {/* Body Tabel */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider bg-gradient-to-r from-slate-100/80 via-slate-50 to-indigo-50/40">
                <th className="px-4 py-3">Judul Konten</th>
                <th className="px-3.5 py-3">Platform</th>
                <th className="px-3.5 py-3">Jenis</th>
                <th className="px-3.5 py-3">Audience</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3">Dibuat</th>
                <th className="px-3.5 py-3">Posting</th>
                <th className="px-2 py-3 text-center">Link</th>
                <th className="px-2 py-3 text-center">Detail</th>
                <th className="px-3.5 py-3 text-right pr-4">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-[10px]">
              {paginatedContents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 bg-slate-50/30">
                    <Sparkles className="mx-auto h-5 w-5 text-slate-300 mb-1" />
                    {contentData.length === 0
                      ? "Belum ada data konten tersimpan."
                      : "Data tidak ditemukan berdasarkan filter."}
                  </td>
                </tr>
              ) : (
                paginatedContents.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gradient-to-r hover:from-blue-50/40 hover:via-indigo-50/20 hover:to-transparent transition-all duration-200 group border-l-2 border-l-transparent hover:border-l-blue-500"
                  >
                    {/* Judul Konten */}
                    <td className="px-4 py-3 font-bold text-slate-800 group-hover:text-blue-700 transition-colors max-w-[200px]">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        <span className="truncate" title={item.title}>
                          {item.title}
                        </span>
                      </div>
                    </td>

                    {/* Platform */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold text-[9px] border shadow-2xs ${getPlatformStyle(item.platform)}`}>
                        <Share2 className="h-2.5 w-2.5 opacity-70" />
                        {item.platform}
                      </span>
                    </td>

                    {/* Jenis Konten */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-600 font-semibold bg-slate-100/70 px-2 py-0.5 rounded-md border border-slate-200/50">
                        <Tag className="h-2.5 w-2.5 text-slate-400" />
                        {item.contentType}
                      </span>
                    </td>

                    {/* Audience */}
                    <td className="px-3.5 py-3 text-slate-600 font-medium whitespace-nowrap">
                      {item.audience}
                    </td>

                    {/* Status Badge */}
                    <td className="px-3.5 py-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold shadow-2xs transition-transform group-hover:scale-105 ${
                          item.status === "Published"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-300/80 shadow-emerald-500/10"
                            : item.status === "Draft"
                            ? "bg-amber-50 text-amber-700 border border-amber-300/80 shadow-amber-500/10"
                            : item.status === "Approval"
                            ? "bg-sky-50 text-sky-700 border border-sky-300/80 shadow-sky-500/10"
                            : "bg-violet-50 text-violet-700 border border-violet-300/80 shadow-violet-500/10"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                            item.status === "Published"
                              ? "bg-emerald-500"
                              : item.status === "Draft"
                              ? "bg-amber-500"
                              : item.status === "Approval"
                              ? "bg-sky-500"
                              : "bg-violet-500"
                          }`}
                        />
                        {item.status}
                      </span>
                    </td>

                    {/* Tanggal Dibuat */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 text-[9px]">
                        <Calendar className="h-2.5 w-2.5 text-slate-400" />
                        {item.createdDate}
                      </span>
                    </td>

                    {/* Tanggal Posting */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 text-[9px]">
                        <Calendar className="h-2.5 w-2.5 text-slate-400" />
                        {item.publishDate}
                      </span>
                    </td>

                    {/* Link File */}
                    <td className="px-2 py-3 text-center whitespace-nowrap">
                      {item.fileUrl ? (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-200/80 transition-all shadow-2xs group/link"
                          title="Buka Link File"
                        >
                          <ExternalLink className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                        </a>
                      ) : (
                        <span className="text-slate-300 font-mono">-</span>
                      )}
                    </td>

                    {/* Akses Detail (Caption, Hashtag, Revisi dalam 1 Grup) */}
                    <td className="px-2 py-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenDetail(`Caption - ${item.title}`, item.caption)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat Caption"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDetail(`Hashtag - ${item.title}`, item.hashtag)}
                          className="p-1 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Lihat Hashtag"
                        >
                          <Hash className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDetail(`Catatan Revisi - ${item.title}`, item.revision)}
                          className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Lihat Catatan Revisi"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Aksi */}
                    <td className="px-3.5 py-3 text-right pr-4 whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-all"
                          title="Edit Konten"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteModal({
                              open: true,
                              id: item.id,
                              title: item.title,
                            })
                          }
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-all"
                          title="Hapus Konten"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Modern */}
        <div className="bg-slate-50/60 border-t border-slate-100 px-4 py-2.5 text-[10px] text-slate-500 flex items-center justify-between">
          <p className="font-medium">
            Menampilkan data{" "}
            <strong className="text-slate-800">
              {filteredContents.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
            </strong>{" "}
            -{" "}
            <strong className="text-slate-800">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredContents.length)}
            </strong>{" "}
            dari <strong className="text-slate-800">{filteredContents.length}</strong>
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-[10px] font-bold rounded-xl border-slate-200"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              <ChevronLeft className="mr-1 h-3 w-3" /> Prev
            </Button>
            <span className="font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-[10px] font-bold rounded-xl border-slate-200"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* MODAL DETAIL */}
      {viewDetailModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50/30">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800 truncate">
                  {viewDetailModal.title}
                </h3>
              </div>
              <button
                onClick={() => setViewDetailModal({ open: false, title: "", content: "" })}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-4 max-h-60 overflow-y-auto">
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-200/60 font-mono text-[11px]">
                {viewDetailModal.content}
              </p>
            </div>
            <div className="flex justify-end border-t border-slate-100 px-4 py-2.5 bg-slate-50/50">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs font-bold rounded-xl border-slate-200"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-2xl border border-slate-200 space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-rose-600">
              <div className="rounded-lg bg-rose-50 p-2">
                <Trash2 className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-900">Hapus Konten</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus konten &quot;<strong className="text-slate-800">{deleteModal.title}</strong>&quot;? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs font-bold rounded-xl border-slate-200"
                onClick={() => setDeleteModal({ open: false, id: null, title: "" })}
              >
                Batal
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-gradient-to-r from-blue-50/50 via-slate-50 to-indigo-50/30">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-600 p-1.5 text-white shadow-2xs">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                <h2 className="text-xs font-bold text-slate-800">
                  {editingId ? "Edit Konten" : "Tambah Konten Baru"}
                </h2>
              </div>
              <button
                onClick={() => setOpenModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3 overflow-y-auto">
              
              {/* Judul Konten */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">
                  Judul Konten <span className="text-rose-500">*</span>
                </label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Masukkan judul konten..."
                  className="h-8 text-xs rounded-xl border-slate-200 focus:ring-blue-500"
                />
              </div>

              {/* Platform & Jenis Konten */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-700">
                    Platform
                  </label>
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleInputChange}
                    className="h-8 w-full rounded-xl border border-slate-200 bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-700">
                    Jenis Konten
                  </label>
                  <select
                    name="contentType"
                    value={formData.contentType}
                    onChange={handleInputChange}
                    className="h-8 w-full rounded-xl border border-slate-200 bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  <label className="mb-1 block text-[11px] font-bold text-slate-700">
                    Target Audience
                  </label>
                  <select
                    name="audience"
                    value={formData.audience}
                    onChange={handleInputChange}
                    className="h-8 w-full rounded-xl border border-slate-200 bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Mahasiswa">Mahasiswa</option>
                    <option value="Dosen">Dosen</option>
                    <option value="Guru">Guru</option>
                    <option value="Peneliti">Peneliti</option>
                    <option value="Penulis Pemula">Penulis Pemula</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-700">
                    Status
                  </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="h-8 w-full rounded-xl border border-slate-200 bg-background px-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  <label className="mb-1 block text-[11px] font-bold text-slate-700">
                    Tanggal Dibuat
                  </label>
                  <Input
                    type="date"
                    name="createdDate"
                    value={formData.createdDate}
                    onChange={handleInputChange}
                    className="h-8 text-xs rounded-xl border-slate-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-700">
                    Tanggal Posting
                  </label>
                  <Input
                    type="date"
                    name="publishDate"
                    value={formData.publishDate}
                    onChange={handleInputChange}
                    className="h-8 text-xs rounded-xl border-slate-200"
                  />
                </div>
              </div>

              {/* Link File Konten */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">
                  Link File Konten
                </label>
                <Input
                  name="fileUrl"
                  value={formData.fileUrl}
                  onChange={handleInputChange}
                  placeholder="https://drive.google.com/..."
                  className="h-8 text-xs rounded-xl border-slate-200"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">
                  Caption
                </label>
                <textarea
                  name="caption"
                  value={formData.caption}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Tulis caption..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Hashtag */}
              <div>
                <label className="mb-1 block text-[11px] font-bold text-slate-700">
                  Hashtag
                </label>
                <textarea
                  name="hashtag"
                  value={formData.hashtag}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="#hashtag..."
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              {/* Catatan Revisi */}
              {!isDesigner && (
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-slate-700">
                    Catatan Revisi
                  </label>
                  <textarea
                    name="revision"
                    value={formData.revision}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Catatan revisi..."
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3 bg-slate-50/50">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-bold rounded-xl border-slate-200"
                onClick={() => setOpenModal(false)}
              >
                Batal
              </Button>
              <Button 
                size="sm" 
                className="h-8 px-4 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-blue-500/20" 
                onClick={handleSave}
              >
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}