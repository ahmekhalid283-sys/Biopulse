"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Award,
  BarChart3,
  Clock3,
  FileText,
  Search,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";

type Result = {
  id: string;
  score: number;
  total: number;
  percentage: number;
  duration_seconds: number;
  started_at: string;
  finished_at: string;

  students?: {
    full_name: string;
  };

  exams?: {
    title: string;
  };
};

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select(`
        *,
        students(full_name),
        exams(title)
      `)
      .order("finished_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setResults(data || []);
  }

  async function deleteResult(id: string) {
    if (!confirm("حذف هذه النتيجة؟")) return;

    const { error } = await supabase
      .from("exam_attempts")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadResults();
  }

  const filtered = useMemo(() => {
    const value = search.toLowerCase();

    return results.filter((r) => {
      const student = r.students?.full_name?.toLowerCase() || "";
      const exam = r.exams?.title?.toLowerCase() || "";

      return student.includes(value) || exam.includes(value);
    });
  }, [results, search]);

  const highest =
    results.length > 0
      ? Math.max(...results.map((r) => Number(r.percentage)))
      : 0;

  const studentsCount = new Set(
    results
      .map((r) => r.students?.full_name)
      .filter(Boolean)
  ).size;

  const examsCount = results.length;

  const average =
    results.length === 0
      ? 0
      : Number(
          (
            results.reduce(
              (sum, r) => sum + Number(r.percentage),
              0
            ) / results.length
          ).toFixed(2)
        );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#07090e] p-4 text-slate-100 sm:p-6 lg:p-10"
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-950">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                نتائج الطلاب
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                متابعة وتحليل نتائج ومحاولات الطلاب في الامتحانات.
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="عدد المحاولات"
            value={examsCount}
            icon={<FileText className="h-6 w-6" />}
            iconClass="bg-blue-500/10 text-blue-400 border border-blue-500/20"
          />

          <StatCard
            title="عدد الطلاب"
            value={studentsCount}
            icon={<Users className="h-6 w-6" />}
            iconClass="bg-purple-500/10 text-purple-400 border border-purple-500/20"
          />

          <StatCard
            title="أعلى نسبة"
            value={`${highest.toFixed(2)}%`}
            icon={<Trophy className="h-6 w-6" />}
            iconClass="bg-amber-500/10 text-amber-400 border border-amber-500/20"
          />

          <StatCard
            title="متوسط النسبة"
            value={`${average}%`}
            icon={<Award className="h-6 w-6" />}
            iconClass="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          />
        </div>

        {/* Search */}
        <div className="mb-6 rounded-3xl border border-slate-800 bg-[#0d1322] p-4 shadow-xl">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث باسم الطالب أو الامتحان..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-[#07090e] py-3.5 pr-12 pl-4 text-sm font-medium text-slate-200 outline-none transition placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            />
          </div>
          <div className="mt-3 flex items-center justify-between px-1">
            <p className="text-xs font-bold text-slate-500">
              عرض {filtered.length} من {results.length} نتيجة
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0d1322] shadow-xl">
          {/* Desktop Table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="bg-[#0b101d] text-slate-300 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4 text-right text-sm font-black">الطالب</th>
                  <th className="px-5 py-4 text-right text-sm font-black">الامتحان</th>
                  <th className="px-5 py-4 text-center text-sm font-black">الدرجة</th>
                  <th className="px-5 py-4 text-center text-sm font-black">النسبة</th>
                  <th className="px-5 py-4 text-center text-sm font-black">المدة</th>
                  <th className="px-5 py-4 text-center text-sm font-black">وقت الحل</th>
                  <th className="px-5 py-4 text-center text-sm font-black">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-14 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
                        <Search className="h-6 w-6" />
                      </div>
                      <p className="mt-4 font-black text-slate-300">لا توجد نتائج</p>
                      <p className="mt-1 text-sm text-slate-500">جرّب البحث باسم مختلف.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const percentage = Number(r.percentage);
                    return (
                      <tr key={r.id} className="transition hover:bg-slate-800/40">
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 border border-blue-500/20 font-black text-blue-400">
                              {r.students?.full_name?.charAt(0)?.toUpperCase() || "؟"}
                            </div>
                            <span className="font-black text-slate-200">
                              {r.students?.full_name || "غير معروف"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-500" />
                            <span className="font-bold text-slate-300">
                              {r.exams?.title || "غير معروف"}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-5 text-center">
                          <span className="rounded-xl bg-slate-800/60 border border-slate-700/50 px-3 py-2 font-black text-slate-300">
                            {r.score}/{r.total}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-center">
                          <span
                            className={`inline-flex rounded-xl px-3 py-2 text-sm font-black border ${
                              percentage >= 85
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : percentage >= 60
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}
                          >
                            {percentage.toFixed(2)}%
                          </span>
                        </td>

                        <td className="px-5 py-5 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-slate-400">
                            <Clock3 className="h-4 w-4" />
                            {r.duration_seconds >= 60
                              ? `${Math.floor(r.duration_seconds / 60)} دقيقة`
                              : `${r.duration_seconds} ثانية`}
                          </div>
                        </td>

                        <td className="px-5 py-5 text-center">
                          <span className="text-xs font-bold text-slate-400">
                            {new Date(r.finished_at).toLocaleString("ar-EG")}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-center">
                          <button
                            onClick={() => deleteResult(r.id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-xs font-black text-red-400 transition hover:bg-red-500/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-3 p-4 md:hidden">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
                  <Search className="h-6 w-6" />
                </div>
                <p className="mt-4 font-black text-slate-300">لا توجد نتائج</p>
              </div>
            ) : (
              filtered.map((r) => {
                const percentage = Number(r.percentage);
                return (
                  <div key={r.id} className="rounded-2xl border border-slate-800 bg-[#07090e] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 border border-blue-500/20 font-black text-blue-400">
                          {r.students?.full_name?.charAt(0)?.toUpperCase() || "؟"}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-black text-slate-200">
                            {r.students?.full_name || "غير معروف"}
                          </h3>
                          <p className="mt-1 truncate text-xs font-bold text-slate-500">
                            {r.exams?.title || "غير معروف"}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black border ${
                          percentage >= 85
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : percentage >= 60
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {percentage.toFixed(2)}%
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-[#0d1322] border border-slate-800 p-3">
                        <p className="text-[11px] font-bold text-slate-500">الدرجة</p>
                        <p className="mt-1 font-black text-slate-200">
                          {r.score}/{r.total}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#0d1322] border border-slate-800 p-3">
                        <p className="text-[11px] font-bold text-slate-500">المدة</p>
                        <p className="mt-1 font-black text-slate-200">
                          {r.duration_seconds >= 60
                            ? `${Math.floor(r.duration_seconds / 60)} دقيقة`
                            : `${r.duration_seconds} ثانية`}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 pt-2">
                      <span className="text-[11px] font-bold text-slate-500">
                        {new Date(r.finished_at).toLocaleString("ar-EG")}
                      </span>

                      <button
                        onClick={() => deleteResult(r.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-xs font-black text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف النتيجة
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d1322] p-5 shadow-xl transition hover:-translate-y-0.5 hover:border-slate-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-400">{title}</p>
          <h2 className="mt-2 text-3xl font-black text-white">{value}</h2>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}