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
    <main dir="rtl" className="min-h-screen bg-[#070b14] text-white">
      <div className="w-full space-y-8">
        {/* Header */}
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
              <span className="text-blue-400">BioPulse</span>
              <ChevronLeft className="h-4 w-4" />
              <span>لوحة الإدارة</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              لوحة التحكم
            </h1>

            <p className="mt-2 max-w-xl text-sm text-slate-400 sm:text-base">
              نظرة شاملة على نشاط المنصة، تقدم الطلاب، والاختبارات في الوقت
              الفعلي.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="group inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm font-semibold text-slate-200 backdrop-blur transition hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
            />
            تحديث البيانات
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
            accent="blue"
            description="إجمالي المحاولات"
          />
        </section>

        {/* Quick Actions */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">الإجراءات السريعة</h2>
            <p className="mt-1 text-sm text-slate-500">
              أهم الأدوات التي تحتاجها لإدارة المنصة بكفاءة.
            </p>
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
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_340px]">
          {/* Latest Results */}
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-black/20">
            <div className="flex flex-col gap-3 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-white">آخر نتائج الطلاب</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    أحدث محاولات الاختبارات
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-400">
                آخر 5 محاولات
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80">
                    <th className="px-5 py-4 text-right text-xs font-bold text-slate-500">
                      الطالب
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold text-slate-500">
                      الامتحان
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold text-slate-500">
                      الدرجة
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-bold text-slate-500">
                      النسبة
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {latestAttempts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-16 text-center text-sm text-slate-500"
                      >
                        لا توجد نتائج حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    latestAttempts.map((a) => {
                      const percentage = Number(a.percentage) || 0;
                      return (
                        <tr
                          key={a.id}
                          className="border-b border-slate-800/80 last:border-0 transition hover:bg-slate-800/40"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-400">
                                {(a.students?.full_name || "?").charAt(0)}
                              </div>
                              <span className="font-semibold text-slate-100">
                                {a.students?.full_name || "طالب"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-400">
                            {a.exams?.title || "—"}
                          </td>
                          <td className="px-5 py-4">
                            <span className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-sm font-bold text-slate-200">
                              {a.score}/{a.total}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-gradient-to-l from-blue-400 to-blue-600"
                                  style={{
                                    width: `${Math.min(100, Math.max(0, percentage))}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-bold text-blue-400">
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

            {/* Mobile */}
            <div className="divide-y divide-slate-800 md:hidden">
              {latestAttempts.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500">
                  لا توجد نتائج حتى الآن.
                </div>
              ) : (
                latestAttempts.map((a) => {
                  const percentage = Number(a.percentage) || 0;
                  return (
                    <div key={a.id} className="space-y-3 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-400">
                            {(a.students?.full_name || "?").charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-100">
                              {a.students?.full_name || "طالب"}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {a.exams?.title || "—"}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-bold text-slate-200">
                          {a.score}/{a.total}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-l from-blue-400 to-blue-600"
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
          <aside className="space-y-5">
            {/* Platform Summary */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl shadow-black/20">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-white">ملخص المنصة</h2>
                  <p className="mt-1 text-xs text-slate-500">إحصائيات سريعة</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>

              <div className="space-y-4">
                <SummaryRow label="الطلاب" value={stats.students} />
                <SummaryRow
                  label="المحتوى"
                  value={stats.chapters + stats.lectures}
                />
                <SummaryRow label="الاختبارات" value={stats.exams} />
                <SummaryRow label="المحاولات" value={stats.attempts} />
              </div>
            </div>

            {/* Challenges Card */}
            <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/50 p-6 shadow-xl shadow-blue-500/10">
              <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
              <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-blue-400/5 blur-2xl" />

              <div className="relative">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20">
                  <Trophy className="h-6 w-6" />
                </div>

                <div className="mb-1 flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    تحديات BioPulse
                  </h2>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 ring-1 ring-blue-500/20">
                    جديد
                  </span>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  نظام البطولات والمنافسات والـ Leaderboard الخاص بالمنصة.
                  حوّل التعلم إلى تجربة تنافسية عالمية.
                </p>

                <button
                  onClick={() => router.push("/admin/challenges")}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  <Zap className="h-4 w-4" />
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

/* ============================== */
/* Stat Card */
/* ============================== */

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
  accent: "blue" | "indigo" | "sky" | "violet";
  description: string;
}) {
  const accents = {
    blue: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20",
    sky: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
    violet: "bg-violet-500/10 text-violet-400 ring-violet-500/20",
  };

  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/10 transition duration-300 hover:-translate-y-1 hover:border-slate-700 hover:shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value.toLocaleString("ar-EG")}
          </p>
          <p className="mt-1 text-xs text-slate-600">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${accents[accent]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full w-1/3 rounded-full bg-slate-700 transition-all duration-500 group-hover:w-2/3" />
      </div>
    </div>
  );
}

/* ============================== */
/* Quick Action */
/* ============================== */

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
    blue: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/20",
  };

  const buttonAccents = {
    blue: "bg-blue-600 hover:bg-blue-500 text-white",
    indigo: "bg-indigo-600 hover:bg-indigo-500 text-white",
  };

  return (
    <div className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/10 transition hover:border-slate-700">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 ${accents[accent]}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-white">{title}</h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
        </div>

        <button
          onClick={onClick}
          className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${buttonAccents[accent]}`}
        >
          {buttonText}
          <ArrowUpLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ============================== */
/* Summary Row */
/* ============================== */

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-bold text-slate-100">
        {value.toLocaleString("ar-EG")}
      </span>
    </div>
  );
}