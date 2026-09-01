"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Bell,
  MessageCircle,
  Users,
  BookOpen,
  Video,
  ClipboardList,
  Trophy,
  ArrowUpLeft,
  Activity,
  RefreshCw,
  ChevronLeft,
  TrendingUp,
  Zap,
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();

  const [stats, setStats] = useState({
    students: 0,
    chapters: 0,
    lectures: 0,
    exams: 0,
    attempts: 0,
  });

  const [latestAttempts, setLatestAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    const [students, chapters, lectures, exams, attempts, latest] =
      await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("chapters").select("*", { count: "exact", head: true }),
        supabase.from("lectures").select("*", { count: "exact", head: true }),
        supabase.from("exams").select("*", { count: "exact", head: true }),
        supabase
          .from("exam_attempts")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("exam_attempts")
          .select(
            `
          *,
          students(full_name),
          exams(title)
        `
          )
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    setStats({
      students: students.count || 0,
      chapters: chapters.count || 0,
      lectures: lectures.count || 0,
      exams: exams.count || 0,
      attempts: attempts.count || 0,
    });

    setLatestAttempts(latest.data || []);
    setLoading(false);
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen bg-[#070b14] text-white selection:bg-blue-500/30 overflow-hidden"
    >
      {/* Decorative Background Glows */}
      <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-400">
              <span className="text-blue-400 font-bold tracking-wide">BioPulse</span>
              <ChevronLeft className="h-4 w-4" />
              <span>لوحة الإدارة</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-l from-white to-slate-400 bg-clip-text text-transparent">
              لوحة التحكم
            </h1>

            <p className="mt-2 max-w-xl text-sm text-slate-400 sm:text-base leading-relaxed">
              نظرة شاملة على نشاط المنصة، تقدم الطلاب، والاختبارات في الوقت الفعلي.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="group inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-md px-5 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:border-slate-600 hover:bg-slate-800 hover:shadow-lg hover:shadow-black/20 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 text-blue-400 ${
                loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"
              }`}
            />
            {loading ? "جاري التحديث..." : "تحديث البيانات"}
          </button>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="إجمالي الطلاب"
            value={stats.students}
            icon={Users}
            accent="blue"
            description="الطلاب المسجلون"
          />
          <StatCard
            title="الفصول"
            value={stats.chapters}
            icon={BookOpen}
            accent="indigo"
            description="الفصول التعليمية"
          />
          <StatCard
            title="المحاضرات"
            value={stats.lectures}
            icon={Video}
            accent="sky"
            description="المحتوى المرئي"
          />
          <StatCard
            title="الامتحانات"
            value={stats.exams}
            icon={ClipboardList}
            accent="violet"
            description="الاختبارات المتاحة"
          />
          <StatCard
            title="المحاولات"
            value={stats.attempts}
            icon={Trophy}
            accent="emerald"
            description="إجمالي المحاولات"
          />
        </section>

        {/* Quick Actions */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">الإجراءات السريعة</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <QuickAction
              icon={Bell}
              accent="blue"
              title="إرسال إشعار"
              description="إرسال رسالة أو إعلان يظهر مباشرة في إشعارات الطلاب."
              buttonText="إرسال إشعار"
              onClick={() => router.push("/admin/notifications")}
            />
            <QuickAction
              icon={MessageCircle}
              accent="indigo"
              title="الدعم العلمي"
              description="فتح محادثات الطلاب والرد على استفساراتهم العلمية."
              buttonText="فتح الدعم"
              onClick={() => router.push("/admin/support")}
            />
          </div>
        </section>

        {/* Main Content */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
          {/* Latest Results */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-3 border-b border-slate-800/60 p-5 sm:flex-row sm:items-center sm:justify-between bg-slate-900/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-white">آخر نتائج الطلاب</h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    أحدث محاولات الاختبارات
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 px-3 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur-md">
                آخر 5 محاولات
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800/60 bg-slate-900/40 text-slate-400">
                    <th className="px-5 py-4 text-right font-medium">الطالب</th>
                    <th className="px-5 py-4 text-right font-medium">الامتحان</th>
                    <th className="px-5 py-4 text-right font-medium">الدرجة</th>
                    <th className="px-5 py-4 text-right font-medium">النسبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {latestAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-16 text-center text-slate-500">
                        لا توجد نتائج حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    latestAttempts.map((a) => {
                      const percentage = Number(a.percentage) || 0;
                      return (
                        <tr
                          key={a.id}
                          className="group transition-colors hover:bg-slate-800/30"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-xs font-bold text-blue-300 ring-1 ring-blue-500/30">
                                {(a.students?.full_name || "?").charAt(0)}
                              </div>
                              <span className="font-medium text-slate-200 group-hover:text-white transition-colors">
                                {a.students?.full_name || "طالب"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-400">
                            {a.exams?.title || "—"}
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-md bg-slate-800/80 border border-slate-700/50 px-2.5 py-1 text-xs font-bold text-slate-200">
                              {a.score}/{a.total}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800 shadow-inner">
                                <div
                                  className="h-full rounded-full bg-gradient-to-l from-blue-400 to-indigo-500 relative"
                                  style={{
                                    width: `${Math.min(100, Math.max(0, percentage))}%`,
                                  }}
                                >
                                  <div className="absolute inset-0 bg-white/20" />
                                </div>
                              </div>
                              <span className="text-xs font-bold text-blue-400 w-9">
                                {percentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="divide-y divide-slate-800/60 md:hidden flex-1">
              {latestAttempts.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">
                  لا توجد نتائج حتى الآن.
                </div>
              ) : (
                latestAttempts.map((a) => {
                  const percentage = Number(a.percentage) || 0;
                  return (
                    <div key={a.id} className="space-y-3 p-4 hover:bg-slate-800/20 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 text-xs font-bold text-blue-300 ring-1 ring-blue-500/30">
                            {(a.students?.full_name || "?").charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-200">
                              {a.students?.full_name || "طالب"}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-400">
                              {a.exams?.title || "—"}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-md bg-slate-800/80 border border-slate-700/50 px-2 py-1 text-xs font-bold text-slate-200">
                          {a.score}/{a.total}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pl-12">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800 shadow-inner">
                          <div
                            className="h-full rounded-full bg-gradient-to-l from-blue-400 to-indigo-500"
                            style={{
                              width: `${Math.min(100, Math.max(0, percentage))}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold text-blue-400">
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Platform Summary */}
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm p-6 shadow-xl shadow-black/20">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-white text-lg">ملخص المنصة</h2>
                  <p className="mt-1 text-xs text-slate-400">إحصائيات سريعة</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>

              <div className="space-y-1">
                <SummaryRow label="الطلاب" value={stats.students} />
                <SummaryRow label="المحتوى" value={stats.chapters + stats.lectures} />
                <SummaryRow label="الاختبارات" value={stats.exams} />
                <SummaryRow label="المحاولات" value={stats.attempts} border={false} />
              </div>
            </div>

            {/* Challenges Card */}
            <div className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-900 via-[#0a1122] to-blue-950/60 p-6 shadow-2xl shadow-blue-900/20 transition-all hover:border-blue-400/50">
              {/* Background glows */}
              <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl transition-all group-hover:bg-blue-400/30" />
              <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-indigo-400/10 blur-2xl" />

              <div className="relative z-10">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-400 ring-1 ring-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  <Trophy className="h-6 w-6" />
                </div>

                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-wide">
                    تحديات BioPulse
                  </h2>
                  <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300 ring-1 ring-blue-500/40 animate-pulse">
                    جديد
                  </span>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-slate-300/80">
                  نظام البطولات والمنافسات والـ Leaderboard الخاص بالمنصة. حوّل التعلم إلى تجربة تنافسية عالمية.
                </p>

                <button
                  onClick={() => router.push("/admin/challenges")}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40 hover:-translate-y-0.5"
                >
                  <Zap className="h-4 w-4 fill-white/20" />
                  إدارة التحديات
                  <ArrowUpLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
  description,
}: {
  title: string;
  value: number;
  icon: any;
  accent: "blue" | "indigo" | "sky" | "violet" | "emerald";
  description: string;
}) {
  const accents = {
    blue: "bg-blue-500/10 text-blue-400 ring-blue-500/20 group-hover:shadow-blue-500/10 group-hover:ring-blue-500/40",
    indigo: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20 group-hover:shadow-indigo-500/10 group-hover:ring-indigo-500/40",
    sky: "bg-sky-500/10 text-sky-400 ring-sky-500/20 group-hover:shadow-sky-500/10 group-hover:ring-sky-500/40",
    violet: "bg-violet-500/10 text-violet-400 ring-violet-500/20 group-hover:shadow-violet-500/10 group-hover:ring-violet-500/40",
    emerald: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20 group-hover:shadow-emerald-500/10 group-hover:ring-emerald-500/40",
  };

  const progressColors = {
    blue: "bg-blue-500",
    indigo: "bg-indigo-500",
    sky: "bg-sky-500",
    violet: "bg-violet-500",
    emerald: "bg-emerald-500",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-900/40 backdrop-blur-md p-5 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-slate-600 hover:bg-slate-800/60 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-400 transition-colors group-hover:text-slate-300">{title}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
            {value.toLocaleString("ar-EG")}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 group-hover:text-slate-400 transition-colors">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 transition-all duration-300 shadow-lg ${accents[accent]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Decorative mini progress bar */}
      <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-slate-800/50">
        <div className={`h-full w-1/3 rounded-full transition-all duration-700 group-hover:w-full opacity-70 ${progressColors[accent]}`} />
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  accent,
  title,
  description,
  buttonText,
  onClick,
}: {
  icon: any;
  accent: "blue" | "indigo";
  title: string;
  description: string;
  buttonText: string;
  onClick: () => void;
}) {
  const accents = {
    blue: "bg-blue-500/10 text-blue-400 ring-blue-500/20 shadow-blue-500/10",
    indigo: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20 shadow-indigo-500/10",
  };

  const buttonAccents = {
    blue: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20",
    indigo: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20",
  };

  return (
    <div className="group rounded-2xl border border-slate-700/40 bg-slate-900/40 backdrop-blur-md p-5 shadow-lg shadow-black/10 transition-all duration-300 hover:border-slate-600 hover:bg-slate-800/50 hover:shadow-xl hover:-translate-y-0.5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 shadow-lg transition-transform duration-300 group-hover:scale-110 ${accents[accent]}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 group-hover:text-white transition-colors">{title}</h3>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-400">
              {description}
            </p>
          </div>
        </div>

        <button
          onClick={onClick}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg transition-all active:scale-95 ${buttonAccents[accent]}`}
        >
          {buttonText}
          <ArrowUpLeft className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, border = true }: { label: string; value: number, border?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-slate-800/40 ${border ? 'border-b border-slate-800/50' : ''}`}>
      <span className="text-sm font-medium text-slate-400">{label}</span>
      <span className="text-sm font-bold text-slate-200">
        {value.toLocaleString("ar-EG")}
      </span>
    </div>
  );
}