"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Trophy,
  ChevronLeft,
  ArrowRight,
  Clock,
  Users,
  ClipboardList,
  RefreshCw,
  HelpCircle,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  challenge_type: "individual" | "team";
  difficulty: string | null;
  status: string | null;
  start_at: string | null;
  end_at: string | null;
  duration_minutes: number | null;
  questions_count: number | null;
  passing_score: number | null;
  allow_retake: boolean;
  public_results: boolean;
  show_leaderboard: boolean;
};

type Question = {
  id: string;
  question_text: string;
  question_type: "mcq" | "true_false" | "essay";
  options: string[];
  correct_answer: string;
  points: number;
};

export default function ChallengeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (challengeId) {
      fetchData();
    }
  }, [challengeId]);

  async function fetchData() {
    try {
      setLoading(true);

      const [challengeRes, questionsRes] = await Promise.all([
        supabase
          .from("challenges")
          .select("*")
          .eq("id", challengeId)
          .single(),
        supabase
          .from("questions")
          .select("*")
          .eq("challenge_id", challengeId)
          .order("created_at", { ascending: true }),
      ]);

      if (challengeRes.error) {
        console.error(challengeRes.error);
        alert("حدث خطأ أثناء جلب بيانات التحدي");
        return;
      }

      if (questionsRes.error) {
        console.error(questionsRes.error);
      }

      setChallenge(challengeRes.data);
      setQuestions(questionsRes.data || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذا السؤال؟")) return;

    try {
      const { error } = await supabase.from("questions").delete().eq("id", id);
      if (error) throw error;

      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err: any) {
      alert("خطأ في الحذف: " + err.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#f7f8fa] p-8 text-center">
        <h1 className="text-xl font-bold text-slate-800">التحدي غير موجود</h1>
        <button
          onClick={() => router.push("/admin/challenges")}
          className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white"
        >
          العودة لقائمة التحديات
        </button>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7f8fa] p-6 sm:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
              <span>BioPulse</span>
              <ChevronLeft className="h-4 w-4" />
              <span
                className="cursor-pointer hover:text-slate-600"
                onClick={() => router.push("/admin/challenges")}
              >
                تحديات BioPulse
              </span>
              <ChevronLeft className="h-4 w-4" />
              <span>إدارة التحدي</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-cyan-400 shadow-sm">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950">
                  {challenge.title}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {challenge.description || "لا يوجد وصف."}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push("/admin/challenges")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 self-start sm:self-auto"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للقائمة
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <ClipboardList className="h-4 w-4" />
              <span className="text-xs font-semibold">عدد الأسئلة</span>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {questions.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-semibold">المدة الزمنية</span>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {challenge.duration_minutes
                ? `${challenge.duration_minutes} دقيقة`
                : "غير محددة"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="h-4 w-4" />
              <span className="text-xs font-semibold">نوع التحدي</span>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {challenge.challenge_type === "team" ? "جماعي (فرق)" : "فردي"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Trophy className="h-4 w-4" />
              <span className="text-xs font-semibold">درجة النجاح</span>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-900">
              {challenge.passing_score ? `${challenge.passing_score}%` : "—"}
            </p>
          </div>
        </div>

        {/* Questions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">
              الأسئلة ({questions.length})
            </h2>

            <button
              onClick={() =>
                router.push(`/admin/challenges/${challengeId}/questions`)
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              إضافة أسئلة للتحدي
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
              <HelpCircle className="mx-auto h-10 w-10 text-slate-300 mb-3" />
              <h3 className="text-lg font-bold text-slate-700">
                لا توجد أسئلة حتى الآن
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                ابدأ بإضافة أسئلة لهذا التحدي.
              </p>
              <button
                onClick={() =>
                  router.push(`/admin/challenges/${challengeId}/questions`)
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                إضافة أول سؤال
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, index) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <span>السؤال {index + 1}</span>
                        <span>•</span>
                        <span>{q.points} درجات</span>
                        <span>•</span>
                        <span>
                          {q.question_type === "mcq"
                            ? "اختيار من متعدد"
                            : q.question_type === "true_false"
                            ? "صح / خطأ"
                            : "مقالي"}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-relaxed">
                        {q.question_text}
                      </h3>

                      {/* Options */}
                      {q.question_type !== "essay" &&
                        q.options &&
                        q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
                            {q.options.map((opt, i) => (
                              <div
                                key={i}
                                className={`px-3 py-2 rounded-xl text-sm border ${
                                  opt === q.correct_answer
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"
                                    : "bg-slate-50 border-slate-200 text-slate-700"
                                }`}
                              >
                                {opt}
                                {opt === q.correct_answer && " ✓"}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>

                    {/* أزرار التعديل والحذف */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          router.push(
                            `/admin/challenges/${challengeId}/questions/${q.id}/edit`
                          )
                        }
                        className="text-blue-600 hover:text-blue-800 p-2 bg-blue-50 rounded-lg transition"
                        title="تعديل السؤال"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-rose-500 hover:text-rose-700 p-2 bg-rose-50 rounded-lg transition"
                        title="حذف السؤال"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}