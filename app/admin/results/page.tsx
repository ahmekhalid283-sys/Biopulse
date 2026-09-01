"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Award,
  BarChart3,
  FileText,
  Save,
  Search,
  Trash2,
  Trophy,
  Users,
  X,
  Eye,
} from "lucide-react";

type Result = {
  id: string;
  score: number;
  total: number;
  percentage: number;
  duration_seconds: number;
  started_at: string;
  finished_at: string;
  students?: { full_name: string };
  exams?: { title: string };
  pendingWritten?: boolean;
};

type AnswerRow = {
  id: string;
  question_id: string;
  student_answer: string | null;
  is_correct: boolean | null;
  question: string;
  question_type: string;
  marks: number;
  correct_answer: string | null;
};

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [search, setSearch] = useState("");

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewAnswers, setReviewAnswers] = useState<AnswerRow[]>([]);
  const [currentResult, setCurrentResult] = useState<Result | null>(null);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select(
        `
        *,
        students(full_name),
        exams(title)
      `
      )
      .order("finished_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    const rows = data || [];
    const attemptIds = rows.map((r) => r.id);
    const pendingSet = new Set<string>();

    if (attemptIds.length > 0) {
      const { data: answers } = await supabase
        .from("exam_answers")
        .select("attempt_id, question_id, is_correct")
        .in("attempt_id", attemptIds);

      const qIds = [...new Set((answers || []).map((a) => a.question_id))];
      const { data: qs } = await supabase
        .from("exam_questions")
        .select("id, question_type")
        .in(
          "id",
          qIds.length ? qIds : ["00000000-0000-0000-0000-000000000000"]
        );

      const typeMap = new Map(
        (qs || []).map((q) => [q.id, q.question_type || "mcq"])
      );

      for (const a of answers || []) {
        if (
          typeMap.get(a.question_id) === "written" &&
          a.is_correct === null
        ) {
          pendingSet.add(a.attempt_id);
        }
      }
    }

    setResults(
      rows.map((r) => ({
        ...r,
        pendingWritten: pendingSet.has(r.id),
      }))
    );
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

  async function openReview(result: Result) {
    setCurrentResult(result);
    setReviewOpen(true);
    setReviewLoading(true);
    setReviewAnswers([]);
    setGrades({});

    try {
      const { data: answers, error } = await supabase
        .from("exam_answers")
        .select("id, question_id, student_answer, is_correct")
        .eq("attempt_id", result.id);

      if (error) {
        alert(error.message);
        return;
      }

      if (!answers?.length) {
        setReviewAnswers([]);
        return;
      }

      const qIds = answers.map((a) => a.question_id);
      const { data: qs, error: qErr } = await supabase
        .from("exam_questions")
        .select("id, question, question_type, marks, correct_answer")
        .in("id", qIds);

      if (qErr) {
        console.error(qErr);
      }

      const qMap = new Map((qs || []).map((q) => [q.id, q]));

      const mapped: AnswerRow[] = answers.map((a) => {
        const q = qMap.get(a.question_id);
        return {
          id: a.id,
          question_id: a.question_id,
          student_answer: a.student_answer,
          is_correct: a.is_correct,
          question: q?.question || "سؤال",
          question_type: q?.question_type || "mcq",
          marks: Number(q?.marks || 0),
          correct_answer: q?.correct_answer || null,
        };
      });

      setReviewAnswers(mapped);

      const initial: Record<string, number> = {};
      mapped.forEach((a) => {
        if (a.question_type === "written") {
          initial[a.id] = a.is_correct ? a.marks : 0;
        }
      });
      setGrades(initial);
    } finally {
      setReviewLoading(false);
    }
  }

  async function saveGrades() {
    if (!currentResult) return;

    try {
      setSaving(true);

      for (const ans of reviewAnswers) {
        if (ans.question_type !== "written") continue;

        const awarded = Math.min(
          Math.max(Number(grades[ans.id] ?? 0), 0),
          ans.marks
        );
        const isCorrect = awarded > 0;

        const { error } = await supabase
          .from("exam_answers")
          .update({ is_correct: isCorrect })
          .eq("id", ans.id);

        if (error) {
          alert(error.message);
          return;
        }
      }

      let score = 0;
      for (const ans of reviewAnswers) {
        if (ans.question_type === "written") {
          score += Math.min(
            Math.max(Number(grades[ans.id] ?? 0), 0),
            ans.marks
          );
        } else if (ans.is_correct) {
          score += ans.marks;
        }
      }

      const total =
        Number(currentResult.total) ||
        reviewAnswers.reduce((s, a) => s + a.marks, 0);

      const percentage =
        total > 0 ? Number(((score / total) * 100).toFixed(2)) : 0;

      const { data: updatedRows, error: upErr } = await supabase
        .from("exam_attempts")
        .update({
          score,
          total,
          percentage,
        })
        .eq("id", currentResult.id)
        .select("id, score, total, percentage");

      if (upErr) {
        console.error("attempt update error:", upErr);
        alert("فشل تحديث النتيجة: " + upErr.message);
        return;
      }

      if (!updatedRows || updatedRows.length === 0) {
        alert(
          "التحديث لم يُطبَّق (غالبًا صلاحيات RLS). نفّذ سياسات الأدمن ثم أعد المحاولة."
        );
        return;
      }

      const updated = updatedRows[0];

      setResults((prev) =>
        prev.map((r) =>
          r.id === currentResult.id
            ? {
                ...r,
                score: Number(updated?.score ?? score),
                total: Number(updated?.total ?? total),
                percentage: Number(updated?.percentage ?? percentage),
                pendingWritten: false,
              }
            : r
        )
      );

      alert("تم حفظ التصحيح وتحديث النتيجة");
      setReviewOpen(false);
      loadResults();
    } finally {
      setSaving(false);
    }
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
    results.map((r) => r.students?.full_name).filter(Boolean)
  ).size;

  const examsCount = results.length;

  const average =
    results.length === 0
      ? 0
      : Number(
          (
            results.reduce((sum, r) => sum + Number(r.percentage), 0) /
            results.length
          ).toFixed(2)
        );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#07090e] p-4 text-slate-100 sm:p-6 lg:p-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-600/20 text-blue-400 shadow-lg shadow-blue-950">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                نتائج الطلاب
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                متابعة النتائج ومراجعة الإجابات وتصحيح المقالي.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="عدد المحاولات"
            value={examsCount}
            icon={<FileText className="h-6 w-6" />}
            iconClass="border border-blue-500/20 bg-blue-500/10 text-blue-400"
          />
          <StatCard
            title="عدد الطلاب"
            value={studentsCount}
            icon={<Users className="h-6 w-6" />}
            iconClass="border border-purple-500/20 bg-purple-500/10 text-purple-400"
          />
          <StatCard
            title="أعلى نسبة"
            value={`${highest.toFixed(2)}%`}
            icon={<Trophy className="h-6 w-6" />}
            iconClass="border border-amber-500/20 bg-amber-500/10 text-amber-400"
          />
          <StatCard
            title="متوسط النسبة"
            value={`${average}%`}
            icon={<Award className="h-6 w-6" />}
            iconClass="border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          />
        </div>

        <div className="mb-6 rounded-3xl border border-slate-800 bg-[#0d1322] p-4 shadow-xl">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث باسم الطالب أو الامتحان..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-[#07090e] py-3.5 pl-4 pr-12 text-sm font-medium text-slate-200 outline-none placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
            />
          </div>
          <p className="mt-3 px-1 text-xs font-bold text-slate-500">
            عرض {filtered.length} من {results.length} نتيجة
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0d1322] shadow-xl">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="border-b border-slate-800 bg-[#0b101d] text-slate-300">
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
                      <p className="font-black text-slate-300">لا توجد نتائج</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const percentage = Number(r.percentage);
                    return (
                      <tr key={r.id} className="transition hover:bg-slate-800/40">
                        <td className="px-5 py-5">
                          <span className="font-black text-slate-200">
                            {r.students?.full_name || "غير معروف"}
                          </span>
                        </td>
                        <td className="px-5 py-5 font-bold text-slate-300">
                          {r.exams?.title || "غير معروف"}
                        </td>
                        <td className="px-5 py-5 text-center font-black text-slate-300">
                          {r.score}/{r.total}
                        </td>
                        <td className="px-5 py-5 text-center">
                          <span
                            className={`inline-flex rounded-xl border px-3 py-2 text-sm font-black ${
                              percentage >= 85
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : percentage >= 60
                                  ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                                  : "border-red-500/20 bg-red-500/10 text-red-400"
                            }`}
                          >
                            {percentage.toFixed(2)}%
                          </span>
                        </td>
                        <td className="px-5 py-5 text-center text-sm font-bold text-slate-400">
                          {r.duration_seconds >= 60
                            ? `${Math.floor(r.duration_seconds / 60)} دقيقة`
                            : `${r.duration_seconds} ثانية`}
                        </td>
                        <td className="px-5 py-5 text-center text-xs font-bold text-slate-400">
                          {new Date(r.finished_at).toLocaleString("ar-EG")}
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex items-center justify-center gap-2">
                            {r.pendingWritten ? (
                              <button
                                onClick={() => openReview(r)}
                                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/15 px-3.5 py-2.5 text-xs font-black text-amber-400 hover:bg-amber-500/25"
                              >
                                <Eye className="h-4 w-4" />
                                في انتظار التصحيح
                              </button>
                            ) : (
                              <button
                                disabled
                                className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-2.5 text-xs font-black text-emerald-400 opacity-90"
                              >
                                <Eye className="h-4 w-4" />
                                تم التصحيح
                              </button>
                            )}
                            <button
                              onClick={() => deleteResult(r.id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-xs font-black text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {filtered.map((r) => {
              const percentage = Number(r.percentage);
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-slate-800 bg-[#07090e] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-slate-200">
                        {r.students?.full_name || "غير معروف"}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {r.exams?.title || "غير معروف"}
                      </p>
                    </div>
                    <span className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-black">
                      {percentage.toFixed(2)}%
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-3">
                      <p className="text-[11px] font-bold text-slate-500">الدرجة</p>
                      <p className="mt-1 font-black">
                        {r.score}/{r.total}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-[#0d1322] p-3">
                      <p className="text-[11px] font-bold text-slate-500">المدة</p>
                      <p className="mt-1 font-black">
                        {r.duration_seconds >= 60
                          ? `${Math.floor(r.duration_seconds / 60)} دقيقة`
                          : `${r.duration_seconds} ثانية`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    {r.pendingWritten ? (
                      <button
                        onClick={() => openReview(r)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-xs font-black text-amber-400"
                      >
                        <Eye className="h-4 w-4" />
                        في انتظار التصحيح
                      </button>
                    ) : (
                      <button
                        disabled
                        className="inline-flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-2.5 text-xs font-black text-emerald-400"
                      >
                        <Eye className="h-4 w-4" />
                        تم التصحيح
                      </button>
                    )}
                    <button
                      onClick={() => deleteResult(r.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-black text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-800 bg-[#0d1322] p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-white">مراجعة الحل</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {currentResult?.students?.full_name} —{" "}
                  {currentResult?.exams?.title}
                </p>
              </div>
              <button
                onClick={() => setReviewOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {reviewLoading ? (
              <p className="py-10 text-center text-slate-400">جاري التحميل...</p>
            ) : reviewAnswers.length === 0 ? (
              <p className="py-10 text-center text-slate-400">
                لا توجد إجابات مسجلة لهذه المحاولة
              </p>
            ) : (
              <div className="space-y-4">
                {reviewAnswers.map((ans, idx) => (
                  <div
                    key={ans.id}
                    className="rounded-2xl border border-slate-800 bg-[#07090e] p-4"
                  >
                    <p className="text-xs font-bold text-slate-500">
                      سؤال {idx + 1}{" "}
                      {ans.question_type === "written"
                        ? "• مقالي"
                        : ans.question_type === "true_false"
                          ? "• صح وخطأ"
                          : "• اختيار"}
                    </p>
                    <p className="mt-1 font-bold text-white">{ans.question}</p>
                    <p className="mt-2 text-sm text-cyan-300">
                      إجابة الطالب: {ans.student_answer || "—"}
                    </p>

                    {ans.question_type === "written" ? (
                      <div className="mt-3 flex items-center gap-3">
                        <label className="text-xs font-bold text-slate-400">
                          الدرجة (من {ans.marks})
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={ans.marks}
                          value={grades[ans.id] ?? 0}
                          onChange={(e) =>
                            setGrades((prev) => ({
                              ...prev,
                              [ans.id]: Number(e.target.value),
                            }))
                          }
                          className="w-24 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-bold text-white outline-none focus:border-cyan-500"
                        />
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">
                        {ans.is_correct ? "✅ صحيحة" : "❌ خاطئة"}
                        {ans.correct_answer
                          ? ` — النموذج: ${ans.correct_answer}`
                          : ""}
                      </p>
                    )}
                  </div>
                ))}

                <button
                  onClick={saveGrades}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-sm font-black text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "جاري الحفظ..." : "حفظ التصحيح وتحديث النتيجة"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
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
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}