"use client";

import { useEffect, useState } from "react";
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

import { Button } from "@/components/ui/button";
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
  rawCreatedDate?: Date;
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
  const [contents, setContents] = useState<ContentItem[]>([]);
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

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const contentsRef = collection(db, "contents");

        // 1. Ambil Semua Data untuk Menghitung Stats KPI & Pipeline
        const snapshot = await getDocs(contentsRef);
        const allData: ContentItem[] = snapshot.docs.map((docSnap) => {
          const item = docSnap.data();
          const dateObj = item.createdDate?.toDate ? item.createdDate.toDate() : new Date();

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

        // Kalkulasi KPI Terpisah
        const total = allData.length;
        const draft = allData.filter((i) => i.status === "Draft").length;
        const revisi = allData.filter((i) => i.status === "Revisi").length;
        const approval = allData.filter((i) => i.status === "Approval").length;
        const published = allData.filter((i) => i.status === "Published").length;

        setStats({ total, draft, revisi, approval, published });

        // 2. Ambil 3 Konten Terbaru untuk Tabel Latest Content
        const latestQuery = query(contentsRef, orderBy("createdDate", "desc"), limit(3));
        const latestSnapshot = await getDocs(latestQuery);

        const latestData: ContentItem[] = latestSnapshot.docs.map((docSnap) => {
          const item = docSnap.data();
          const dateObj = item.createdDate?.toDate ? item.createdDate.toDate() : new Date();

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

        setLatestContents(latestData);

        // 3. Ambil 3 Log Aktivitas Real dari Koleksi "activity_logs"
        const logsRef = collection(db, "activity_logs");
        const logsQuery = query(logsRef, orderBy("timestamp", "desc"), limit(3));
        const logsSnapshot = await getDocs(logsQuery);

        const fetchedActivities: ActivityLogItem[] = logsSnapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const ts: Timestamp = data.timestamp;
          const dateObj = ts?.toDate ? ts.toDate() : new Date();

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
            userName: userName,
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

  // Helper untuk styling platform berwarna
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

  // Kartu KPI Dipisah Menjadi 5 Kartu Full Gradient
  const statCards = [
    {
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
    <div className="space-y-4 max-w-full overflow-hidden text-xs pb-4 px-1 sm:px-0">
      
      {/* 1. FULL GRADIENT KPI STATS CARDS */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {statCards.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-2xl border p-3 sm:p-3.5 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg bg-gradient-to-br ${item.gradient} ${item.borderColor} ${item.shadowColor}`}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl transition-all duration-300 group-hover:scale-150" />

              <div className="relative z-10 flex items-center justify-between gap-1">
                <span className={`text-[9px] sm:text-[10px] font-bold tracking-wider uppercase truncate ${item.titleColor}`}>
                  {item.title}
                </span>
                <div className={`rounded-xl p-1 sm:p-1.5 border backdrop-blur-md shadow-sm shrink-0 transition-transform group-hover:scale-110 ${item.iconBg}`}>
                  <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </div>
              </div>

              <div className="relative z-10 mt-2 flex items-baseline justify-between gap-1">
                <h2 className={`text-xl sm:text-2xl font-black tracking-tight font-sans ${item.textColor}`}>
                  {item.value}
                </h2>
                <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold border shadow-xs ${item.badgeBg}`}>
                  <TrendingUp className="mr-0.5 sm:mr-1 h-2 w-2 sm:h-2.5 sm:w-2.5 text-white/90" />
                  {item.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. MIDDLE SECTION: RECENT ACTIVITY & PIPELINE STATUS */}
      <div className="grid gap-3 xl:grid-cols-5">
        
        {/* RECENT ACTIVITY TIMELINE */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm xl:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 text-white shadow-xs">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Aktivitas Terbaru</h2>
                  <p className="text-[9px] text-slate-400">Log riwayat aksi seluruh user sistem</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
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
                      className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 rounded-xl p-2 transition-all hover:bg-slate-50/80 border border-slate-100/60 sm:border-transparent hover:border-slate-200/60 bg-slate-50/30 sm:bg-transparent"
                    >
                      <div className="flex items-start sm:items-center gap-2 min-w-0">
                        <div className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1 sm:mt-0 ${act.color} shadow-xs`} />
                        <span className={`inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded-md text-[9px] border shrink-0 ${badgeStyle}`}>
                          <Shield className="h-2.5 w-2.5 opacity-70" />
                          {act.userName}
                        </span>
                        <span className="text-[10px] text-slate-600 truncate">
                          {act.action}{" "}
                          <strong className="text-slate-900 font-semibold">&quot;{act.targetTitle}&quot;</strong>
                        </span>
                      </div>

                      <span className="self-end sm:self-auto text-[8px] sm:text-[9px] font-medium text-slate-400 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/50 shrink-0">
                        {act.formattedTime}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* MODERN PIPELINE STATUS */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm xl:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-1.5 text-white shadow-xs">
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900">Status Pipeline</h2>
                  <p className="text-[9px] text-slate-400">Distribusi tahap konten</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Draft */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500 shadow-xs" /> Draft
                  </span>
                  <span className="text-slate-600 font-mono font-bold">
                    {stats.draft} <span className="font-normal text-slate-400">({getPercentage(stats.draft)}%)</span>
                  </span>
                </div>
                <Progress value={getPercentage(stats.draft)} className="h-1.5 bg-amber-100/60 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:to-orange-500 rounded-full" />
              </div>

              {/* Revisi */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-violet-500 shadow-xs" /> Revisi
                  </span>
                  <span className="text-slate-600 font-mono font-bold">
                    {stats.revisi} <span className="font-normal text-slate-400">({getPercentage(stats.revisi)}%)</span>
                  </span>
                </div>
                <Progress value={getPercentage(stats.revisi)} className="h-1.5 bg-violet-100/60 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-purple-600 rounded-full" />
              </div>

              {/* Approval */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-sky-500 shadow-xs" /> Approval
                  </span>
                  <span className="text-slate-600 font-mono font-bold">
                    {stats.approval} <span className="font-normal text-slate-400">({getPercentage(stats.approval)}%)</span>
                  </span>
                </div>
                <Progress value={getPercentage(stats.approval)} className="h-1.5 bg-sky-100/60 [&>div]:bg-gradient-to-r [&>div]:from-sky-400 [&>div]:to-blue-500 rounded-full" />
              </div>

              {/* Published */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-xs" /> Published
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
              <h2 className="text-xs font-bold text-slate-900">Konten Terbaru</h2>
              <p className="text-[9px] font-medium text-slate-500 hidden sm:block">Daftar konten yang baru saja dimasukkan ke sistem</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-[10px] font-bold text-blue-700 bg-white/80 hover:bg-blue-600 hover:text-white border-blue-200 shadow-2xs rounded-xl transition-all"
            onClick={() => (window.location.href = "/content")}
          >
            Lihat Semua
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Button>
        </div>

        {/* MOBILE CARD VIEW (Hanya Muncul di Layar HP / Small Screens) */}
        <div className="block md:hidden p-3 space-y-2.5 divide-y divide-slate-100">
          {latestContents.length === 0 ? (
            <div className="py-6 text-center text-slate-400 bg-slate-50/30 rounded-xl">
              <Sparkles className="mx-auto h-5 w-5 text-slate-300 mb-1" />
              Belum ada data konten terbaru.
            </div>
          ) : (
            latestContents.map((item) => (
              <div key={item.id} className="pt-2.5 first:pt-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-800 text-xs line-clamp-2">{item.title}</h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-bold shrink-0 ${
                      item.status === "Published"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-300/80"
                        : item.status === "Draft"
                        ? "bg-amber-50 text-amber-700 border border-amber-300/80"
                        : item.status === "Approval"
                        ? "bg-sky-50 text-sky-700 border border-sky-300/80"
                        : "bg-violet-50 text-violet-700 border border-violet-300/80"
                    }`}
                  >
                    <span
                      className={`h-1 w-1 rounded-full animate-pulse ${
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

                <div className="flex flex-wrap items-center justify-between gap-2 text-[9px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border ${getPlatformStyle(item.platform)}`}>
                      <Share2 className="h-2 w-2 opacity-70" />
                      {item.platform}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-600 font-semibold bg-slate-100/70 px-1.5 py-0.5 rounded-md border border-slate-200/50">
                      <Tag className="h-2 w-2 text-slate-400" />
                      {item.contentType}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-200/60">
                      <Calendar className="h-2 w-2 text-slate-400" />
                      {item.createdDate}
                    </span>
                  </div>

                  {item.fileUrl && (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-200 transition-all ml-auto"
                    >
                      <span>Buka</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (Muncul di Layar Sedang & Besar) */}
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
                    {/* Judul Konten */}
                    <td className="px-4 py-3 font-bold text-slate-800 group-hover:text-blue-700 transition-colors max-w-[220px]">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        <span className="truncate" title={item.title}>
                          {item.title}
                        </span>
                      </div>
                    </td>

                    {/* Platform */}
                    <td className="px-3.5 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-bold text-[9px] border shadow-2xs ${getPlatformStyle(item.platform)}`}>
                        <Share2 className="h-2.5 w-2.5 opacity-70" />
                        {item.platform}
                      </span>
                    </td>

                    {/* Jenis Konten */}
                    <td className="px-3.5 py-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 font-semibold bg-slate-100/70 px-2 py-0.5 rounded-md border border-slate-200/50">
                        <Tag className="h-2.5 w-2.5 text-slate-400" />
                        {item.contentType}
                      </span>
                    </td>

                    {/* Status Konten */}
                    <td className="px-3.5 py-3 text-center">
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

                    {/* Tanggal dibuat */}
                    <td className="px-3.5 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 text-[9px]">
                        <Calendar className="h-2.5 w-2.5 text-slate-400" />
                        {item.createdDate}
                      </span>
                    </td>

                    {/* Link Akses File */}
                    <td className="px-3.5 py-3 text-right pr-4">
                      {item.fileUrl ? (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-[9px] font-bold text-blue-600 bg-blue-50/80 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-200/80 transition-all shadow-2xs group/link"
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
        
        {/* Footer Kecil Tabel */}
        <div className="bg-slate-50/50 border-t border-slate-100 px-3 sm:px-4 py-2 text-[9px] text-slate-400 flex items-center justify-between">
          <span>Menampilkan 3 konten terbaru</span>
          <span className="font-mono text-[8px] text-slate-300">Live Updated</span>
        </div>
      </div>

    </div>
  );
}