"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  Activity,
  ArrowUpLeft,
  Bell,
  BookOpen,
  ClipboardList,
  MessageCircle,
  RefreshCw,
  Trophy,
  Users,
  Video,
  Zap,
  ChevronLeft,
  MoreHorizontal,
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

    const [
      students,
      chapters,
      lectures,
      exams,
      attempts,
      latest,
    ] = await Promise.all([
      supabase
        .from("students")
        .select("*", { count: "exact", head: true }),

      supabase
        .from("chapters")
        .select("*", { count: "exact", head: true }),

      supabase
        .from("lectures")
        .select("*", { count: "exact", head: true }),

      supabase
        .from("exams")
        .select("*", { count: "exact", head: true }),

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

  const number = (value: number) => value.toLocaleString("en-US");

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#050811] text-white"
    >
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute right-[10%] top-[-180px] h-[500px] w-[500px] rounded-full bg-blue-600/[0.06] blur-[150px]" />
        <div className="absolute left-[-150px] bottom-[5%] h-[450px] w-[450px] rounded-full bg-indigo-600/[0.04] blur-[150px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="mb-4 flex items-center gap-2 text-xs">
              <span className="font-bold tracking-[0.2em] text-blue-400">
                BIOPULSE
              </span>

              <ChevronLeft className="h-3.5 w-3.5 text-slate-700" />

              <span className="text-slate-500">
                لوحة الإدارة
              </span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              لوحة التحكم
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              كل ما تحتاجه لمتابعة نشاط BioPulse في مكان واحد.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            disabled={loading}
            className="
              inline-flex h-11 items-center justify-center gap-2
              rounded-xl border border-white/[0.08]
              bg-white/[0.035] px-4
              text-sm font-semibold text-slate-300
              transition-all
              hover:border-blue-500/30
              hover:bg-blue-500/[0.06]
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <RefreshCw
              className={`h-4 w-4 text-blue-400 ${
                loading ? "animate-spin" : ""
              }`}
            />

            {loading ? "جاري التحديث..." : "تحديث البيانات"}
          </button>
        </header>

        {/* =====================================================
            STATS
        ===================================================== */}

        <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">

          <StatCard
            title="إجمالي الطلاب"
            value={stats.students}
            description="الطلاب المسجلون"
            icon={Users}
            color="blue"
          />

          <StatCard
            title="الفصول"
            value={stats.chapters}
            description="الفصول التعليمية"
            icon={BookOpen}
            color="purple"
          />

          <StatCard
            title="المحاضرات"
            value={stats.lectures}
            description="المحتوى المرئي"
            icon={Video}
            color="cyan"
          />

          <StatCard
            title="الامتحانات"
            value={stats.exams}
            description="الاختبارات المتاحة"
            icon={ClipboardList}
            color="orange"
          />

          <StatCard
            title="المحاولات"
            value={stats.attempts}
            description="إجمالي المحاولات"
            icon={Trophy}
            color="green"
          />

        </section>

        {/* =====================================================
            QUICK ACTIONS
        ===================================================== */}

        <section className="mb-8">

          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                الإجراءات السريعة
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                الأدوات التي تستخدمها بشكل متكرر
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            <ActionCard
              icon={Bell}
              title="إرسال إشعار"
              description="أرسل إعلانًا أو إشعارًا لجميع الطلاب أو لطلاب محددين."
              button="إرسال إشعار"
              color="blue"
              onClick={() => router.push("/admin/notifications")}
            />

            <ActionCard
              icon={MessageCircle}
              title="الدعم العلمي"
              description="تابع استفسارات الطلاب ورسائل الدعم والرد عليها."
              button="فتح الدعم"
              color="purple"
              onClick={() => router.push("/admin/support")}
            />

          </div>
        </section>

        {/* =====================================================
            MAIN GRID
        ===================================================== */}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">

          {/* ===================================================
              LATEST RESULTS
          =================================================== */}

          <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080d18]/90 shadow-2xl shadow-black/20">

            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Activity className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-bold text-white">
                    آخر نتائج الطلاب
                  </h2>

                  <p className="mt-1 text-xs text-slate-600">
                    أحدث محاولات الاختبارات
                  </p>
                </div>

              </div>

              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/[0.05] hover:text-slate-300">
                <MoreHorizontal className="h-5 w-5" />
              </button>

            </div>

            {/* Desktop */}
            <div className="hidden md:block">

              <table className="w-full">

                <thead>
                  <tr className="border-b border-white/[0.05] bg-white/[0.01] text-[11px] uppercase tracking-wide text-slate-600">

                    <th className="px-6 py-4 text-right font-semibold">
                      الطالب
                    </th>

                    <th className="px-6 py-4 text-right font-semibold">
                      الامتحان
                    </th>

                    <th className="px-6 py-4 text-right font-semibold">
                      الدرجة
                    </th>

                    <th className="px-6 py-4 text-right font-semibold">
                      النتيجة
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {latestAttempts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-16 text-center text-sm text-slate-600"
                      >
                        لا توجد نتائج حتى الآن.
                      </td>
                    </tr>
                  ) : (
                    latestAttempts.map((attempt) => {

                      const percentage =
                        Number(attempt.percentage) || 0;

                      return (
                        <tr
                          key={attempt.id}
                          className="
                            border-b border-white/[0.04]
                            transition-colors
                            hover:bg-white/[0.025]
                          "
                        >

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="
                                flex h-9 w-9
                                items-center justify-center
                                rounded-full
                                bg-gradient-to-br
                                from-blue-500/20
                                to-indigo-500/20
                                text-xs font-bold
                                text-blue-300
                                ring-1 ring-blue-500/20
                              ">
                                {(attempt.students?.full_name || "?").charAt(0)}
                              </div>

                              <span className="text-sm font-semibold text-slate-300">
                                {attempt.students?.full_name || "طالب"}
                              </span>

                            </div>

                          </td>

                          <td className="px-6 py-4 text-sm text-slate-500">
                            {attempt.exams?.title || "—"}
                          </td>

                          <td className="px-6 py-4">

                            <span className="font-mono text-sm font-semibold text-slate-300">
                              {number(Number(attempt.score) || 0)}
                              <span className="mx-1 text-slate-700">
                                /
                              </span>
                              {number(Number(attempt.total) || 0)}
                            </span>

                          </td>

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.06]">

                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.max(0, percentage)
                                    )}%`,
                                  }}
                                />

                              </div>

                              <span className="font-mono text-xs font-bold text-blue-400">
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
            <div className="divide-y divide-white/[0.05] md:hidden">

              {latestAttempts.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-600">
                  لا توجد نتائج حتى الآن.
                </div>
              ) : (
                latestAttempts.map((attempt) => {

                  const percentage =
                    Number(attempt.percentage) || 0;

                  return (
                    <div
                      key={attempt.id}
                      className="space-y-4 p-5"
                    >

                      <div className="flex items-center justify-between gap-3">

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="
                            flex h-9 w-9 shrink-0
                            items-center justify-center
                            rounded-full
                            bg-blue-500/10
                            text-xs font-bold
                            text-blue-400
                          ">
                            {(attempt.students?.full_name || "?").charAt(0)}
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-bold text-slate-300">
                              {attempt.students?.full_name || "طالب"}
                            </p>

                            <p className="mt-1 truncate text-xs text-slate-600">
                              {attempt.exams?.title || "—"}
                            </p>

                          </div>

                        </div>

                        <span className="font-mono text-xs font-bold text-slate-400">
                          {number(Number(attempt.score) || 0)}/
                          {number(Number(attempt.total) || 0)}
                        </span>

                      </div>

                      <div className="flex items-center gap-3 pr-12">

                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">

                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, percentage)
                              )}%`,
                            }}
                          />

                        </div>

                        <span className="font-mono text-xs font-bold text-blue-400">
                          {percentage.toFixed(1)}%
                        </span>

                      </div>

                    </div>
                  );
                })
              )}

            </div>

          </div>

          {/* ===================================================
              SIDEBAR
          =================================================== */}

          <aside className="space-y-5">

            {/* Platform Overview */}

            <div className="rounded-2xl border border-white/[0.07] bg-[#080d18]/90 p-6">

              <div className="mb-5">

                <div className="flex items-center justify-between">

                  <div>
                    <h2 className="font-bold text-white">
                      ملخص المنصة
                    </h2>

                    <p className="mt-1 text-xs text-slate-600">
                      الإحصائيات الحالية
                    </p>
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Activity className="h-4 w-4" />
                  </div>

                </div>

              </div>

              <div className="space-y-1">

                <SummaryRow
                  label="الطلاب"
                  value={stats.students}
                />

                <SummaryRow
                  label="الفصول"
                  value={stats.chapters}
                />

                <SummaryRow
                  label="المحاضرات"
                  value={stats.lectures}
                />

                <SummaryRow
                  label="الامتحانات"
                  value={stats.exams}
                />

                <SummaryRow
                  label="المحاولات"
                  value={stats.attempts}
                  border={false}
                />

              </div>

            </div>

            {/* Challenges */}

            <div className="
              group relative overflow-hidden
              rounded-2xl
              border border-blue-500/20
              bg-gradient-to-br
              from-[#091426]
              via-[#081120]
              to-[#07101e]
              p-6
            ">

              <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative">

                <div className="mb-5 flex items-center justify-between">

                  <div className="
                    flex h-11 w-11
                    items-center justify-center
                    rounded-xl
                    bg-blue-500/10
                    text-blue-400
                  ">
                    <Trophy className="h-5 w-5" />
                  </div>

                  <span className="
                    rounded-full
                    border border-blue-500/20
                    bg-blue-500/10
                    px-2.5 py-1
                    text-[10px]
                    font-bold
                    tracking-wide
                    text-blue-400
                  ">
                    NEW
                  </span>

                </div>

                <h2 className="text-lg font-bold text-white">
                  تحديات BioPulse
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  إدارة البطولات والمنافسات والـ Leaderboard
                  الخاص بالمنصة.
                </p>

                <button
                  onClick={() =>
                    router.push("/admin/challenges")
                  }
                  className="
                    mt-6 flex h-11 w-full
                    items-center justify-center gap-2
                    rounded-xl
                    bg-blue-600
                    text-sm font-bold text-white
                    shadow-lg shadow-blue-600/10
                    transition
                    hover:bg-blue-500
                    active:scale-[0.98]
                  "
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

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  description: string;
  icon: any;
  color: "blue" | "purple" | "cyan" | "orange" | "green";
}) {
  const styles = {
    blue: {
      icon: "bg-blue-500/10 text-blue-400",
      line: "from-blue-500 to-cyan-400",
    },

    purple: {
      icon: "bg-purple-500/10 text-purple-400",
      line: "from-purple-500 to-indigo-400",
    },

    cyan: {
      icon: "bg-cyan-500/10 text-cyan-400",
      line: "from-cyan-500 to-blue-400",
    },

    orange: {
      icon: "bg-orange-500/10 text-orange-400",
      line: "from-orange-500 to-amber-400",
    },

    green: {
      icon: "bg-emerald-500/10 text-emerald-400",
      line: "from-emerald-500 to-teal-400",
    },
  };

  return (
    <div
      className="
        group relative overflow-hidden
        rounded-2xl
        border border-white/[0.07]
        bg-[#080d18]/90
        p-5
        transition-all duration-300
        hover:-translate-y-1
        hover:border-white/[0.12]
        hover:bg-[#0a1020]
        hover:shadow-2xl
        hover:shadow-black/20
      "
    >

      <div className="flex items-start justify-between gap-3">

        <div>
          <p className="text-xs font-semibold text-slate-600">
            {title}
          </p>

          <p className="mt-3 font-mono text-3xl font-bold tracking-tight text-white">
            {value.toLocaleString("en-US")}
          </p>

          <p className="mt-1.5 text-[11px] text-slate-600">
            {description}
          </p>
        </div>

        <div
          className={`
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-xl
            ${styles[color].icon}
          `}
        >
          <Icon className="h-5 w-5" />
        </div>

      </div>

      <div className="mt-5 h-[2px] w-full overflow-hidden rounded-full bg-white/[0.04]">

        <div
          className={`
            h-full w-1/4
            rounded-full
            bg-gradient-to-r
            ${styles[color].line}
            opacity-70
            transition-all duration-700
            group-hover:w-full
          `}
        />

      </div>

    </div>
  );
}

/* =========================================================
   ACTION CARD
========================================================= */

function ActionCard({
  icon: Icon,
  title,
  description,
  button,
  color,
  onClick,
}: {
  icon: any;
  title: string;
  description: string;
  button: string;
  color: "blue" | "purple";
  onClick: () => void;
}) {
  const styles = {
    blue: {
      icon: "bg-blue-500/10 text-blue-400",
      button: "bg-blue-600 hover:bg-blue-500",
    },

    purple: {
      icon: "bg-purple-500/10 text-purple-400",
      button: "bg-purple-600 hover:bg-purple-500",
    },
  };

  return (
    <div
      className="
        group flex flex-col
        justify-between gap-5
        rounded-2xl
        border border-white/[0.07]
        bg-[#080d18]/90
        p-5
        transition-all duration-300
        hover:border-white/[0.12]
        hover:bg-[#0a1020]
        sm:flex-row sm:items-center
      "
    >

      <div className="flex items-center gap-4">

        <div
          className={`
            flex h-11 w-11 shrink-0
            items-center justify-center
            rounded-xl
            ${styles[color].icon}
          `}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h3 className="font-bold text-slate-200">
            {title}
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-600">
            {description}
          </p>
        </div>

      </div>

      <button
        onClick={onClick}
        className={`
          inline-flex h-10
          shrink-0 items-center justify-center
          gap-2 rounded-xl px-4
          text-xs font-bold text-white
          transition
          active:scale-95
          ${styles[color].button}
        `}
      >
        {button}

        <ArrowUpLeft className="h-4 w-4" />
      </button>

    </div>
  );
}

/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({
  label,
  value,
  border = true,
}: {
  label: string;
  value: number;
  border?: boolean;
}) {
  return (
    <div
      className={`
        flex items-center justify-between
        py-3.5
        ${border ? "border-b border-white/[0.05]" : ""}
      `}
    >
      <span className="text-sm text-slate-600">
        {label}
      </span>

      <span className="font-mono text-sm font-bold text-slate-300">
        {value.toLocaleString("en-US")}
      </span>
    </div>
  );
}