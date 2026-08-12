"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  FileEdit,
  FileText,
  PenTool,
  Sparkles,
  ExternalLink,
  Clock,
  Shield,
  Layers,
  TrendingUp,
  Calendar,
  Tag,
  Share2,
  Clock3,
} from "lucide-react";

import { Progress } from "@/components/ui/progress";

import { collection, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ContentItem {
  id: string;
  title: string;
  platform: string;
  contentType: string;
  audience: string;
  status: "Published" | "Draft" | "Revisi" | "Approval";
  createdDate: string;
  rawCreatedDate: Date;
  fileUrl: string;
}

interface ActivityLogItem {
  id: string;
  userName: string;
  action: string;
  targetTitle: string;
  timestamp: Date | null;
  formattedTime: string;
  color: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [, setContents] = useState<ContentItem[]>([]);
  const [latestContents, setLatestContents] = useState<ContentItem[]>([]);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);

  // State Hitungan KPI Terpisah
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    revisi: 0,
    approval: 0,
    published: 0,
  });

  // Helper konversi Timestamp/Date yang aman
  const parseTimestamp = (dateValue: unknown): Date => {
    if (!dateValue) return new Date();
    if (typeof (dateValue as Timestamp).toDate === "function") {
      return (dateValue as Timestamp).toDate();
    }
    if (dateValue instanceof Date) return dateValue;
    return new Date(dateValue as string | number);
  };

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // 1. Ambil Semua Data Konten (Untuk Stats KPI & 3 Data Terbaru)
        const contentsRef = collection(db, "contents");
        const snapshot = await getDocs(contentsRef);

        const allData: ContentItem[] = snapshot.docs.map((docSnap) => {
          const item = docSnap.data();
          const dateObj = parseTimestamp(item.createdDate);

          return {
            id: docSnap.id,
            title: item.title ?? "Tanpa Judul",
            platform: item.platform ?? "Instagram",
            contentType: item.contentType ?? "Carousel",
            audience: item.audience ?? "Umum",
            status: item.status ?? "Draft",
            createdDate: dateObj.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            }),
            rawCreatedDate: dateObj,
            fileUrl: item.fileUrl ?? "",
          };
        });

        setContents(allData);

        // Kalkulasi KPI
        const total = allData.length;
        const draft = allData.filter((i) => i.status === "Draft").length;
        const revisi = allData.filter((i) => i.status === "Revisi").length;
        const approval = allData.filter((i) => i.status === "Approval").length;
        const published = allData.filter((i) => i.status === "Published").length;

        setStats({ total, draft, revisi, approval, published });

        // Ambil 3 Konten Terbaru dari array memori
        const sortedContents = [...allData].sort(
          (a, b) => b.rawCreatedDate.getTime() - a.rawCreatedDate.getTime()
        );
        setLatestContents(sortedContents.slice(0, 3));

        // 2. Ambil 3 Log Aktivitas Terbaru
        const logsRef = collection(db, "activity_logs");
        const logsQuery = query(logsRef, orderBy("timestamp", "desc"), limit(3));
        const logsSnapshot = await getDocs(logsQuery);

        const fetchedActivities: ActivityLogItem[] = logsSnapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const dateObj = parseTimestamp(data.timestamp);

          const timeString =
            dateObj.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }) + " WIB";

          const userName = data.userName || "Administrator";

          let dotColor = "bg-blue-500 shadow-blue-500/50";
          if (userName.toLowerCase().includes("admin")) {
            dotColor = "bg-indigo-500 shadow-indigo-500/50";
          } else if (
            userName.toLowerCase().includes("designer") ||
            userName.toLowerCase().includes("desainer")
          ) {
            dotColor = "bg-fuchsia-500 shadow-fuchsia-500/50";
          }

          return {
            id: docSnap.id,
            userName,
            action: data.action || "melakukan aktivitas",
            targetTitle: data.targetTitle || "Konten",
            timestamp: dateObj,
            formattedTime: timeString,
            color: dotColor,
          };
        });

        setActivities(fetchedActivities);
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const getPercentage = (value: number) => {
    if (stats.total === 0) return 0;
    return Math.round((value / stats.total) * 100);
  };

  // Helper styling warna badge platform
  const getPlatformStyle = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes("instagram")) {
      return "bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 text-pink-700 border-pink-200/80";
    } if (p.includes("tiktok")) {
      return "bg-slate-900/10 text-slate-900 border-slate-300";
    } if (p.includes("youtube")) {
      return "bg-rose-500/10 text-rose-700 border-rose-200/80";
    } if (p.includes("linkedin")) {
      return "bg-sky-500/10 text-sky-800 border-sky-200/80";
    } if (p.includes("twitter") || p.includes("x")) {
      return "bg-blue-500/10 text-blue-700 border-blue-200/80";
    }
    return "bg-indigo-500/10 text-indigo-700 border-indigo-200/80";
  };

  const statCards = [
    {
      id: "total",
      title: "Total Content",
      value: stats.total,
      badge: "Realtime",
      icon: FileText,
      gradient: "from-blue-600 via-blue-500 to-indigo-600",
      textColor: "text-white",
      titleColor: "text-blue-100",
      badgeBg: "bg-white/20 text-white border-white/30 backdrop-blur-md",
      iconBg: "bg-white/20 text-white border-white/20",
      borderColor: "border-blue-400/30 hover:border-blue-300",
      shadowColor: "shadow-blue-500/20",
    },
    {
      id: "draft",
      title: "Draft",
      value: stats.draft,
      badge: `${getPercentage(stats.draft)}%`,
      icon: FileEdit,
      gradient: "from-amber-500 via-orange-500 to-amber-600",
      textColor: "text-white",
      titleColor: "text-amber-100",
      badgeBg: "bg-white/20 text-white border-white/30 backdrop-blur-md",
      iconBg: "bg-white/20 text-white border-white/20",
      borderColor: "border-amber-400/30 hover:border-amber-300",
      shadowColor: "shadow-orange-500/20",
    },
    {
      id: "revisi",
      title: "Revisi",
      value: stats.revisi,
      badge: `${getPercentage(stats.revisi)}%`,
      icon: PenTool,
      gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
      textColor: "text-white",
      titleColor: "text-violet-100",
      badgeBg: "bg-white/20 text-white border-white/30 backdrop-blur-md",
      iconBg: "bg-white/20 text-white border-white/20",
      borderColor: "border-violet-400/30 hover:border-violet-300",
      shadowColor: "shadow-purple-500/20",
    },
    {
      id: "approval",
      title: "Approval",
      value: stats.approval,
      badge: `${getPercentage(stats.approval)}%`,
      icon: Clock3,
      gradient: "from-sky-500 via-blue-600 to-indigo-600",
      textColor: "text-white",
      titleColor: "text-sky-100",
      badgeBg: "bg-white/20 text-white border-white/30 backdrop-blur-md",
      iconBg: "bg-white/20 text-white border-white/20",
      borderColor: "border-sky-400/30 hover:border-sky-300",
      shadowColor: "shadow-sky-500/20",
    },
    {
      id: "published",
      title: "Published",
      value: stats.published,
      badge: `${getPercentage(stats.published)}%`,
      icon: CheckCircle2,
      gradient: "from-emerald-600 via-teal-600 to-emerald-700",
      textColor: "text-white",
      titleColor: "text-emerald-100",
      badgeBg: "bg-white/20 text-white border-white/30 backdrop-blur-md",
      iconBg: "bg-white/20 text-white border-white/20",
      borderColor: "border-emerald-400/30 hover:border-emerald-300",
      shadowColor: "shadow-emerald-500/20",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[320px] flex-col items-center justify-center gap-2 rounded-2xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-sm">
        <div className="relative flex items-center justify-center">
          <div className="h-10 w-10 animate-ping rounded-full bg-blue-400/20" />
          <Sparkles className="absolute h-6 w-6 animate-spin text-blue-600" />
        </div>
        <p className="text-xs font-semibold text-slate-500">Memuat Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 pb-6 px-3 sm:px-6 min-w-0">
      {/* 1. KPI STATS CARDS */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`group relative overflow-hidden rounded-2xl border p-3 sm:p-3.5 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-br ${item.gradient} ${item.borderColor} ${item.shadowColor}`}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl transition-all duration-300 group-hover:scale-150" />

              <div className="relative z-10 flex items-center justify-between gap-1">
                <span className={`text-[9px] sm:text-[10px] font-bold tracking-wider uppercase truncate ${item.titleColor}`}>
                  {item.title}
                </span>
                <div className={`rounded-xl p-1 sm:p-1.5 border backdrop-blur-md shadow-sm shrink-0 transition-transform group-hover:scale-110 ${item.iconBg}`}>
                  <Icon className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
                </div>
              </div>

              <div className="relative z-10 mt-2 flex items-baseline justify-between gap-1">
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight font-sans ${item.textColor}`}>
                  {item.value}
                </h2>
                <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold border ${item.badgeBg}`}>
                  <TrendingUp className="mr-0.5 sm:mr-1 h-2 w-2 sm:h-2.5 sm:w-2.5 text-white/90" />
                  {item.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. MIDDLE SECTION: RECENT ACTIVITY & PIPELINE STATUS */}
      <div className="grid gap-3 lg:grid-cols-5">
        {/* RECENT ACTIVITY TIMELINE */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-sm lg:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 text-white shadow-xs">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">Aktivitas Terbaru</h2>
                  <p className="text-[9px] sm:text-[10px] text-slate-400">Log riwayat aksi seluruh user sistem</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Feed
              </span>
            </div>

            <div className="space-y-2">
              {activities.length === 0 ? (
                <div className="text-center py-5 text-slate-400 text-[10px]">
                  <Clock className="mx-auto h-5 w-5 text-slate-300 mb-1" />
                  Belum ada aktivitas tercatat.
                </div>
              ) : (
                activities.map((act) => {
                  const isDesigner =
                    act.userName.toLowerCase().includes("designer") ||
                    act.userName.toLowerCase().includes("desainer");

                  const badgeStyle = isDesigner
                    ? "bg-purple-50 text-purple-700 border-purple-200/80"
                    : "bg-blue-50 text-blue-700 border-blue-200/80";

                  return (
                    <div
                      key={act.id}
                      className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 rounded-xl p-2.5 sm:p-2 transition-all hover:bg-slate-50/80 border border-slate-200/60 sm:border-transparent hover:border-slate-200/60 bg-slate-50/40 sm:bg-transparent"
                    >
                      <div className="flex items-start sm:items-center gap-2 min-w-0">
                        <div className={`h-2.5 w-2.5 rounded-full shrink-0 mt-0.5 sm:mt-0 ${act.color}`} />
                        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                          <span className={`inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded-md text-[9px] border shrink-0 ${badgeStyle}`}>
                            <Shield className="h-2.5 w-2.5 opacity-70" />
                            {act.userName}
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-slate-600 leading-tight">
                            {act.action}{" "}
                            <strong className="text-slate-900 font-semibold">&quot;{act.targetTitle}&quot;</strong>
                          </span>
                        </div>
                      </div>

                      <span className="self-end sm:self-auto text-[8px] sm:text-[9px] font-medium text-slate-400 bg-white sm:bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/50 shrink-0">
                        {act.formattedTime}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* STATUS PIPELINE */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5 text-white shadow-xs">
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900">Status Pipeline</h2>
                  <p className="text-[9px] sm:text-[10px] text-slate-400">Distribusi tahap konten</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Draft */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px] sm:text-[11px]">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Draft
                  </span>
                  <span className="text-slate-600 font-mono font-bold">
                    {stats.draft} <span className="font-normal text-slate-400">({getPercentage(stats.draft)}%)</span>
                  </span>
                </div>
                <Progress value={getPercentage(stats.draft)} className="h-1.5 bg-amber-100/60 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500 rounded-full" />
              </div>

              {/* Revisi */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px] sm:text-[11px]">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-violet-500" /> Revisi
                  </span>
                  <span className="text-slate-600 font-mono font-bold">
                    {stats.revisi} <span className="font-normal text-slate-400">({getPercentage(stats.revisi)}%)</span>
                  </span>
                </div>
                <Progress value={getPercentage(stats.revisi)} className="h-1.5 bg-violet-100/60 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-purple-600 rounded-full" />
              </div>

              {/* Approval */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px] sm:text-[11px]">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-500" /> Approval
                  </span>
                  <span className="text-slate-600 font-mono font-bold">
                    {stats.approval} <span className="font-normal text-slate-400">({getPercentage(stats.approval)}%)</span>
                  </span>
                </div>
                <Progress value={getPercentage(stats.approval)} className="h-1.5 bg-sky-100/60 [&>div]:bg-gradient-to-r [&>div]:from-sky-400 [&>div]:to-blue-500 rounded-full" />
              </div>

              {/* Published */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px] sm:text-[11px]">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Published
                  </span>
                  <span className="text-slate-600 font-mono font-bold">
                    {stats.published} <span className="font-normal text-slate-400">({getPercentage(stats.published)}%)</span>
                  </span>
                </div>
                <Progress value={getPercentage(stats.published)} className="h-1.5 bg-emerald-100/60 [&>div]:bg-gradient-to-r [&>div]:from-emerald-400 [&>div]:to-teal-500 rounded-full" />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 text-center">
            <span className="text-[9px] font-medium text-slate-400">Cloud Firestore Realtime Sync</span>
          </div>
        </div>
      </div>

      {/* 3. LATEST CONTENT SECTION */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-slate-200/70 p-3 sm:px-4 sm:py-3 bg-gradient-to-r from-blue-50/50 via-slate-50/60 to-purple-50/40">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 p-1.5 text-white shadow-xs">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">Konten Terbaru</h2>
              <p className="text-[9px] sm:text-[10px] font-medium text-slate-500 hidden sm:block">Daftar konten yang baru saja dimasukkan ke sistem</p>
            </div>
          </div>
          <Link
            href="/content"
            className="inline-flex items-center justify-center h-7 px-3 text-[10px] font-bold text-blue-700 bg-white hover:bg-blue-600 hover:text-white border border-blue-200/80 rounded-xl transition-all shadow-xs"
          >
            Lihat Semua
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Link>
        </div>

        {/* MOBILE CARD VIEW (Optimized UX) */}
        <div className="block md:hidden p-3 space-y-3">
          {latestContents.length === 0 ? (
            <div className="py-6 text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Sparkles className="mx-auto h-5 w-5 text-slate-300 mb-1" />
              Belum ada data konten terbaru.
            </div>
          ) : (
            latestContents.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 space-y-2.5 shadow-xs transition-all active:scale-[0.99]"
              >
                {/* Header Kartu: Judul & Status */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold shrink-0 ${
                      item.status === "Published"
                        ? "bg-emerald-100/80 text-emerald-800 border border-emerald-300/80"
                        : item.status === "Draft"
                        ? "bg-amber-100/80 text-amber-800 border border-amber-300/80"
                        : item.status === "Approval"
                        ? "bg-sky-100/80 text-sky-800 border border-sky-300/80"
                        : "bg-violet-100/80 text-violet-800 border border-violet-300/80"
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
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border ${getPlatformStyle(item.platform)}`}>
                    <Share2 className="h-2.5 w-2.5 opacity-70" />
                    {item.platform}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-600 font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200/70">
                    <Tag className="h-2.5 w-2.5 text-slate-400" />
                    {item.contentType}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-white px-2 py-0.5 rounded-md border border-slate-200/70 ml-auto">
                    <Calendar className="h-2.5 w-2.5 text-slate-400" />
                    {item.createdDate}
                  </span>
                </div>

                {/* Tombol Aksi File jika ada */}
                {item.fileUrl && (
                  <div className="pt-1 border-t border-slate-200/50 flex justify-end">
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-200/80 transition-all shadow-xs active:bg-blue-700"
                    >
                      <span>Buka File Dokumen</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider bg-gradient-to-r from-slate-100/80 via-slate-50 to-indigo-50/40">
                <th className="px-4 py-3">Judul Konten</th>
                <th className="px-3.5 py-3">Platform</th>
                <th className="px-3.5 py-3">Jenis</th>
                <th className="px-3.5 py-3 text-center">Status</th>
                <th className="px-3.5 py-3">Tanggal</th>
                <th className="px-3.5 py-3 text-right pr-4">Aksi / Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[10px]">
              {latestContents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 bg-slate-50/30">
                    <Sparkles className="mx-auto h-5 w-5 text-slate-300 mb-1" />
                    Belum ada data konten terbaru.
                  </td>
                </tr>
              ) : (
                latestContents.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gradient-to-r hover:from-blue-50/40 hover:via-indigo-50/20 hover:to-transparent transition-all duration-200 group border-l-2 border-l-transparent hover:border-l-blue-500"
                  >
                    <td className="px-4 py-3 font-bold text-slate-800 group-hover:text-blue-700 transition-colors max-w-[220px]">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        <span className="truncate" title={item.title}>
                          {item.title}
                        </span>
                      </div>
                    </td>

                    <td className="px-3.5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold text-[9px] border ${getPlatformStyle(item.platform)}`}>
                        <Share2 className="h-2.5 w-2.5 opacity-70" />
                        {item.platform}
                      </span>
                    </td>

                    <td className="px-3.5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 font-semibold bg-slate-100/70 px-2 py-0.5 rounded-md border border-slate-200/50">
                        <Tag className="h-2.5 w-2.5 text-slate-400" />
                        {item.contentType}
                      </span>
                    </td>

                    <td className="px-3.5 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold transition-transform group-hover:scale-105 ${
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

                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 text-[9px]">
                        <Calendar className="h-2.5 w-2.5 text-slate-400" />
                        {item.createdDate}
                      </span>
                    </td>

                    <td className="px-3.5 py-3 text-right pr-4">
                      {item.fileUrl ? (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-200/80 transition-all group/link"
                          title="Buka File"
                        >
                          <span>Buka</span>
                          <ExternalLink className="h-2.5 w-2.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                        </a>
                      ) : (
                        <span className="text-slate-300 text-[10px] font-mono">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Tabel */}
        <div className="bg-slate-50/50 border-t border-slate-100 px-3 sm:px-4 py-2 text-[9px] text-slate-400 flex items-center justify-between">
          <span>Menampilkan 3 konten terbaru</span>
          <span className="font-mono text-[8px] text-slate-300">Live Updated</span>
        </div>
      </div>
    </div>
  );
}