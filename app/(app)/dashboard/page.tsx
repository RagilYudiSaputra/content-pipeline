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

  // State Hitungan KPI
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

        // Kalkulasi KPI
        const total = allData.length;
        const draft = allData.filter((i) => i.status === "Draft").length;
        const revisi = allData.filter((i) => i.status === "Revisi").length;
        const approval = allData.filter((i) => i.status === "Approval").length;
        const published = allData.filter((i) => i.status === "Published").length;

        setStats({ total, draft, revisi, approval, published });

        // 2. Ambil 3 Konten Terbaru untuk Tabel Latest Content (diperkecil agar tidak scrolling)
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

          const timeString = dateObj.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }) + " WIB";

          const userName = data.userName || "Administrator";
          
          // Tentukan warna titik (dot) berdasarkan role
          let dotColor = "bg-blue-500";
          if (userName.toLowerCase().includes("admin")) {
            dotColor = "bg-blue-600";
          } else if (userName.toLowerCase().includes("designer") || userName.toLowerCase().includes("desainer")) {
            dotColor = "bg-purple-600";
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

  const statCards = [
    {
      title: "Total Content",
      value: stats.total,
      badge: "Realtime",
      icon: FileText,
      color: "text-blue-600",
      bgIcon: "bg-blue-50/85 border-blue-100",
      glow: "from-blue-500/5 via-transparent to-transparent",
    },
    {
      title: "Draft",
      value: stats.draft,
      badge: `${getPercentage(stats.draft)}%`,
      icon: FileEdit,
      color: "text-amber-600",
      bgIcon: "bg-amber-50/85 border-amber-100",
      glow: "from-amber-500/5 via-transparent to-transparent",
    },
    {
      title: "Revisi / Approval",
      value: stats.revisi + stats.approval,
      badge: `${getPercentage(stats.revisi + stats.approval)}%`,
      icon: PenTool,
      color: "text-violet-600",
      bgIcon: "bg-violet-50/85 border-violet-100",
      glow: "from-violet-500/5 via-transparent to-transparent",
    },
    {
      title: "Published",
      value: stats.published,
      badge: `${getPercentage(stats.published)}%`,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgIcon: "bg-emerald-50/85 border-emerald-100",
      glow: "from-emerald-500/5 via-transparent to-transparent",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center text-xs text-slate-400 font-medium">
        <Sparkles className="mr-2 h-4 w-4 animate-spin text-blue-600" />
        Memuat Dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-full overflow-hidden text-xs pb-2">
      
      {/* 1. MODERN KPI STATS CARDS (Compact Padding) */}
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {statCards.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={`relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs transition-all bg-gradient-to-b ${item.glow}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-500 tracking-wide uppercase">
                  {item.title}
                </span>
                <div className={`rounded-lg p-1.5 border ${item.bgIcon} ${item.color} shadow-2xs`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <h2 className="text-xl font-black tracking-tight text-slate-900 font-sans">
                  {item.value}
                </h2>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/60">
                  {item.badge}
                  <ArrowUpRight className="ml-0.5 h-2.5 w-2.5 text-slate-400" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. MIDDLE SECTION: RECENT ACTIVITY & PIPELINE STATUS (Compact Padding) */}
      <div className="grid gap-2.5 xl:grid-cols-5">
        
        {/* RECENT ACTIVITY TIMELINE */}
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs xl:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div className="flex items-center gap-1.5">
                <div className="rounded-md bg-blue-50 p-1 text-blue-600 border border-blue-100">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h2 className="text-[11px] font-bold text-slate-900">Aktivitas Terbaru</h2>
                  <p className="text-[9px] text-slate-400">Log riwayat aksi seluruh user sistem</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Feed
              </span>
            </div>

            <div className="space-y-2">
              {activities.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-[10px]">
                  <Clock className="mx-auto h-5 w-5 text-slate-300 mb-1" />
                  Belum ada aktivitas tercatat.
                </div>
              ) : (
                activities.map((act) => {
                  const isDesigner = act.userName.toLowerCase().includes("designer") || act.userName.toLowerCase().includes("desainer");
                  const badgeStyle = isDesigner 
                    ? "bg-purple-50 text-purple-700 border-purple-200/60" 
                    : "bg-blue-50 text-blue-700 border-blue-200/60";

                  return (
                    <div
                      key={act.id}
                      className="group relative flex items-center justify-between gap-2 rounded-lg p-2 transition-all hover:bg-slate-50 border border-transparent hover:border-slate-100"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${act.color} shadow-2xs`} />
                        <span className={`inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded text-[9px] border shrink-0 ${badgeStyle}`}>
                          <Shield className="h-2.5 w-2.5 opacity-70" />
                          {act.userName}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                          {act.action} <strong className="text-slate-800 font-medium">"{act.targetTitle}"</strong>
                        </span>
                      </div>

                      <span className="text-[9px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 shrink-0">
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
        <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs xl:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
              <div className="flex items-center gap-1.5">
                <div className="rounded-md bg-violet-50 p-1 text-violet-600 border border-violet-100">
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h2 className="text-[11px] font-bold text-slate-900">Status Pipeline</h2>
                  <p className="text-[9px] text-slate-400">Distribusi tahap konten</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {/* Draft */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Draft
                  </span>
                  <span className="text-slate-500 font-mono font-bold">
                    {stats.draft} <span className="font-normal text-slate-400">({getPercentage(stats.draft)}%)</span>
                  </span>
                </div>
                <Progress value={getPercentage(stats.draft)} className="h-1 bg-amber-50 [&>div]:bg-amber-500 rounded-full" />
              </div>

              {/* Revisi */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" /> Revisi
                  </span>
                  <span className="text-slate-500 font-mono font-bold">
                    {stats.revisi} <span className="font-normal text-slate-400">({getPercentage(stats.revisi)}%)</span>
                  </span>
                </div>
                <Progress value={getPercentage(stats.revisi)} className="h-1 bg-violet-50 [&>div]:bg-violet-500 rounded-full" />
              </div>

              {/* Approval */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> Approval
                  </span>
                  <span className="text-slate-500 font-mono font-bold">
                    {stats.approval} <span className="font-normal text-slate-400">({getPercentage(stats.approval)}%)</span>
                  </span>
                </div>
                <Progress value={getPercentage(stats.approval)} className="h-1 bg-sky-50 [&>div]:bg-sky-500 rounded-full" />
              </div>

              {/* Published */}
              <div>
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Published
                  </span>
                  <span className="text-slate-500 font-mono font-bold">
                    {stats.published} <span className="font-normal text-slate-400">({getPercentage(stats.published)}%)</span>
                  </span>
                </div>
                <Progress value={getPercentage(stats.published)} className="h-1 bg-emerald-50 [&>div]:bg-emerald-500 rounded-full" />
              </div>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 text-center">
            <span className="text-[9px] text-slate-400">Cloud Firestore Realtime Sync</span>
          </div>
        </div>

      </div>

      {/* 3. LATEST CONTENT TABLE (Compact Padding & limit 3 items) */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 bg-slate-50/50">
          <div>
            <h2 className="text-[11px] font-bold text-slate-900">Konten Terbaru</h2>
            <p className="text-[9px] text-slate-400">Daftar konten yang baru saja dimasukkan ke sistem</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            onClick={() => (window.location.href = "/content")}
          >
            Lihat Semua
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/30">
                <th className="px-3 py-2">Judul</th>
                <th className="px-3 py-2">Platform</th>
                <th className="px-3 py-2">Jenis</th>
                <th className="px-3 py-2 text-center">Status</th>
                <th className="px-3 py-2">Tanggal</th>
                <th className="px-3 py-2 text-right pr-3">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[10px]">
              {latestContents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    Belum ada data konten terbaru.
                  </td>
                </tr>
              ) : (
                latestContents.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-3 py-2 font-semibold text-slate-900 max-w-[200px] truncate">
                      {item.title}
                    </td>
                    <td className="px-3 py-2 text-slate-600 font-medium">
                      {item.platform}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {item.contentType}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold shadow-2xs ${
                          item.status === "Published"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                            : item.status === "Draft"
                            ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                            : item.status === "Approval"
                            ? "bg-sky-50 text-sky-700 border border-sky-200/60"
                            : "bg-violet-50 text-violet-700 border border-violet-200/60"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap font-medium">
                      {item.createdDate}
                    </td>
                    <td className="px-3 py-2 text-right pr-3">
                      {item.fileUrl ? (
                        <a
                          href={item.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Buka File"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}