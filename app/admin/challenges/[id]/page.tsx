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
  Layers,
  Send,
} from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  description: string | null;
  challenge_type: "individual" | "team";
  difficulty: string | null;
  status: string | null;
  duration_minutes: number | null;
  passing_score: number | null;
  total_rounds?: number | null;
};

type Round = {
  id: string;
  round_number: number;
  title: string;
  participant_limit: number | null;
  qualified_count: number | null;
  duration_minutes: number | null;
  passing_score: number | null;
  status: string | null;
};

type Question = {
  id: string;
  question_text: string;
  question_type: "mcq" | "true_false" | "written";
  options: string[];
  correct_answer: string;
  points: number;
};

export default function ChallengeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const challengeId = params.id as string;

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const isElimination = rounds.length > 0;

  // شرط معرفة ما إذا كان التحدي مرئياً ومتاحاً للطلاب
  const isVisibleToStudents =
    challenge?.status === "registration" ||
    challenge?.status === "upcoming" ||
    challenge?.status === "active";

  useEffect(() => {
    if (challengeId) fetchData();
  }, [challengeId]);

  useEffect(() => {
    if (!challengeId) return;

    if (isElimination && selectedRoundId) {
      fetchRoundQuestions(selectedRoundId);
    } else if (!isElimination) {
      fetchChallengeQuestions();
    }
  }, [selectedRoundId, isElimination, challengeId]);

  async function fetchData() {
    try {
      setLoading(true);

      const [challengeRes, roundsRes] = await Promise.all([
        supabase.from("challenges").select("*").eq("id", challengeId).single(),
        supabase
          .from("challenge_rounds")
          .select("*")
          .eq("challenge_id", challengeId)
          .order("round_number", { ascending: true }),
      ]);

      if (challengeRes.error) {
        alert("حدث خطأ أثناء جلب بيانات التحدي");
        return;
      }

      setChallenge(challengeRes.data);

      const roundsData = roundsRes.data || [];
      setRounds(roundsData);

      if (roundsData.length > 0) {
        setSelectedRoundId(roundsData[0].id);
      } else {
        await fetchChallengeQuestions();
      }
    } finally {
      setLoading(false);
    }
  }

  function mapQuestion(q: any): Question {
    return {
      id: q.id,
      question_text: q.question,
      question_type: (q.question_type as Question["question_type"]) || "mcq",
      options: [q.option_a, q.option_b, q.option_c, q.option_d].filter(
        (o) => o && o !== "-"
      ),
      correct_answer:
        q.correct_answer === "A"
          ? q.option_a
          : q.correct_answer === "B"
            ? q.option_b
            : q.correct_answer === "C"
              ? q.option_c
              : q.correct_answer === "D"
                ? q.option_d
                : q.correct_answer,
      points: Number(q.marks) || 0,
    };
  }

  async function fetchChallengeQuestions() {
    const { data: roundsData } = await supabase
      .from("challenge_rounds")
      .select("id")
      .eq("challenge_id", challengeId);

    if (!roundsData || roundsData.length === 0) {
      setQuestions([]);
      return;
    }

    const roundIds = roundsData.map((r) => r.id);

    const { data: links } = await supabase
      .from("challenge_round_questions")
      .select("question_id, question_order")
      .in("round_id", roundIds)
      .order("question_order", { ascending: true });

    if (!links || links.length === 0) {
      setQuestions([]);
      return;
    }

    const ids = links.map((l) => l.question_id);

    const { data, error } = await supabase
      .from("challenge_questions")
      .select(
        "id, question, question_type, option_a, option_b, option_c, option_d, correct_answer, marks"
      )
      .in("id", ids);

    if (error || !data) {
      setQuestions([]);
      return;
    }

    setQuestions(data.map(mapQuestion));
  }

  async function fetchRoundQuestions(roundId: string) {
    const { data: links, error: linksError } = await supabase
      .from("challenge_round_questions")
      .select("question_id, question_order")
      .eq("round_id", roundId)
      .order("question_order", { ascending: true });

    if (linksError || !links || links.length === 0) {
      setQuestions([]);
      return;
    }

    const ids = links.map((l) => l.question_id);

    const { data, error } = await supabase
      .from("challenge_questions")
      .select(
        "id, question, question_type, option_a, option_b, option_c, option_d, correct_answer, marks"
      )
      .in("id", ids);

    if (error || !data) {
      setQuestions([]);
      return;
    }

    const orderMap = new Map(
      links.map((l) => [l.question_id, l.question_order ?? 0])
    );

    const mapped = data
      .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
      .map(mapQuestion);

    setQuestions(mapped);
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!confirm("هل أنت متأكد من حذف هذا السؤال؟")) return;

    try {
      if (isElimination && selectedRoundId) {
        await supabase
          .from("challenge_round_questions")
          .delete()
          .eq("round_id", selectedRoundId)
          .eq("question_id", questionId);
      }

      const { error } = await supabase
        .from("challenge_questions")
        .delete()
        .eq("id", questionId);

      if (error) throw error;

      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err: any) {
      alert("خطأ في الحذف: " + err.message);
    }
  }

  async function publishChallenge() {
    try {
      setPublishing(true);

      const { error } = await supabase
        .from("challenges")
        .update({ status: "registration" }) // أو "active" لو عايزه يبدأ فورًا
        .eq("id", challengeId);

      if (error) {
        alert("فشل النشر: " + error.message);
        return;
      }

      alert("تم فتح التحدي للطلاب بنجاح");
      setChallenge((prev) =>
        prev ? { ...prev, status: "registration" } : prev
      );
    } catch (err: any) {
      alert("حدث خطأ أثناء النشر: " + err.message);
    } finally {
      setPublishing(false);
    }
  }

  function goToAddQuestion() {
    if (isElimination && selectedRoundId) {
      router.push(
        `/admin/challenges/${challengeId}/questions?roundId=${selectedRoundId}`
      );
    } else {
      router.push(`/admin/challenges/${challengeId}/questions`);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b14]">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#070b14] p-8 text-center text-white"
      >
        <h1 className="text-xl font-bold">التحدي غير موجود</h1>
        <button
          onClick={() => router.push("/admin/challenges")}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold"
        >
          العودة للقائمة
        </button>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b14] p-6 text-white sm:p-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <span className="text-blue-400">BioPulse</span>
              <ChevronLeft className="h-4 w-4" />
              <span
                className="cursor-pointer hover:text-slate-300"
                onClick={() => router.push("/admin/challenges")}
              >
                التحديات
              </span>
              <ChevronLeft className="h-4 w-4" />
              <span>إدارة التحدي</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold">{challenge.title}</h1>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${
                      isVisibleToStudents
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {isVisibleToStudents ? "متاح للطلاب" : "مسودة"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {challenge.description || "لا يوجد وصف"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isVisibleToStudents && (
              <button
                onClick={publishChallenge}
                disabled={publishing}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {publishing ? "جاري النشر..." : "فتح للطلاب"}
              </button>
            )}

            <button
              onClick={() => router.push("/admin/challenges")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800"
            >
              <ArrowRight className="h-4 w-4" />
              العودة للقائمة
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={ClipboardList}
            label="عدد الأسئلة"
            value={questions.length}
          />
          <StatCard
            icon={Clock}
            label="المدة"
            value={
              challenge.duration_minutes
                ? `${challenge.duration_minutes} دقيقة`
                : "—"
            }
          />
          <StatCard
            icon={Users}
            label="النوع"
            value={challenge.challenge_type === "team" ? "جماعي" : "فردي"}
          />
          <StatCard
            icon={Trophy}
            label="درجة النجاح"
            value={
              challenge.passing_score ? `${challenge.passing_score}%` : "—"
            }
          />
        </div>

        {/* Rounds */}
        {isElimination && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-bold">أدوار التصفيات</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {rounds.map((round) => (
                <button
                  key={round.id}
                  onClick={() => setSelectedRoundId(round.id)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                    selectedRoundId === round.id
                      ? "bg-blue-600 text-white"
                      : "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {round.title}
                  <span className="mr-2 text-xs opacity-70">
                    (دور {round.round_number})
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Questions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              الأسئلة ({questions.length})
              {isElimination && selectedRoundId && (
                <span className="mr-2 text-sm font-normal text-slate-400">
                  — {rounds.find((r) => r.id === selectedRoundId)?.title}
                </span>
              )}
            </h2>

            <button
              onClick={goToAddQuestion}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              {isElimination ? "إضافة سؤال لهذا الدور" : "إضافة أسئلة للتحدي"}
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-12 text-center">
              <HelpCircle className="mx-auto mb-3 h-10 w-10 text-slate-600" />
              <h3 className="text-lg font-bold text-slate-300">
                لا توجد أسئلة حتى الآن
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {isElimination
                  ? "أضف أسئلة خاصة بهذا الدور"
                  : "ابدأ بإضافة أسئلة لهذا التحدي"}
              </p>
              <button
                onClick={goToAddQuestion}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-500"
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
                  className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
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

                      <h3 className="text-base font-bold leading-relaxed text-white">
                        {q.question_text}
                      </h3>

                      {q.question_type !== "written" &&
                        q.options &&
                        q.options.length > 0 && (
                          <div className="grid grid-cols-1 gap-2 pt-3 sm:grid-cols-2">
                            {q.options.map((opt, i) => (
                              <div
                                key={i}
                                className={`rounded-xl border px-3 py-2 text-sm ${
                                  opt === q.correct_answer
                                    ? "border-emerald-500/40 bg-emerald-500/10 font-bold text-emerald-300"
                                    : "border-slate-700 bg-slate-800 text-slate-300"
                                }`}
                              >
                                {opt}
                                {opt === q.correct_answer && " ✓"}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/admin/challenges/${challengeId}/questions/${q.id}/edit`
                          )
                        }
                        className="rounded-lg bg-blue-500/15 p-2 text-blue-400 transition hover:bg-blue-500/25"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="rounded-lg bg-red-500/15 p-2 text-red-400 transition hover:bg-red-500/25"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}