"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trophy,
  ArrowRight,
} from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  duration_minutes: number | null;
  passing_score: number | null;
  status: string | null;
};

type Round = {
  id: string;
  round_number: number;
  title: string;
  duration_minutes: number | null;
  passing_score: number | null;
};

type Question = {
  id: string;
  question: string;
  question_type: "mcq" | "true_false" | "written";
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string; // A | B | C | D
  marks: number;
  explanation: string | null;
  image_url: string | null;
  option_a_image: string | null;
  option_b_image: string | null;
  option_c_image: string | null;
  option_d_image: string | null;
};

type AnswerMap = Record<string, string>; // questionId -> A/B/C/D or text

export default function ChallengePlayPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roundIdFromUrl = searchParams.get("roundId");

  const challengeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
    pendingReview: boolean;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (challengeId) loadQuiz();
  }, [challengeId, roundIdFromUrl]);

  // Timer
  useEffect(() => {
    if (secondsLeft === null || finished || loading) return;

    if (secondsLeft <= 0) {
      handleSubmit(true);
      return;
    }

    const t = setTimeout(() => setSecondsLeft((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, finished, loading]);

  async function loadQuiz() {
    try {
      setLoading(true);
      setErrorMsg("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (student) setStudentId(student.id);

      // التحدي
      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .select("id, title, duration_minutes, passing_score, status")
        .eq("id", challengeId)
        .in("status", ["registration", "upcoming", "active"])
        .single();

      if (challengeError || !challengeData) {
        setErrorMsg("التحدي غير متاح");
        setLoading(false);
        return;
      }

      setChallenge(challengeData);

      // جلب الأدوار
      const { data: roundsData } = await supabase
        .from("challenge_rounds")
        .select("id, round_number, title, duration_minutes, passing_score")
        .eq("challenge_id", challengeId)
        .order("round_number", { ascending: true });

      if (roundsData) {
        setRounds(roundsData);
      }

      const currentRound =
        roundsData?.find((r) => r.id === roundIdFromUrl) ||
        roundsData?.[0] ||
        null;

      setRound(currentRound);

      if (!currentRound) {
        setErrorMsg("لا توجد أسئلة مرتبطة بهذا التحدي بعد");
        setLoading(false);
        return;
      }

      // أسئلة الدور
      const { data: links } = await supabase
        .from("challenge_round_questions")
        .select("question_id, question_order")
        .eq("round_id", currentRound.id)
        .order("question_order", { ascending: true });

      if (!links || links.length === 0) {
        setErrorMsg("لا توجد أسئلة في هذا الدور");
        setLoading(false);
        return;
      }

      const ids = links.map((l) => l.question_id);

      const { data: questionsData, error: qError } = await supabase
        .from("challenge_questions")
        .select(`
          id, question, question_type,
          option_a, option_b, option_c, option_d,
          option_a_image, option_b_image, option_c_image, option_d_image,
          correct_answer, marks, explanation, image_url
        `)
        .in("id", ids);

      if (qError || !questionsData) {
        setErrorMsg("فشل تحميل الأسئلة");
        setLoading(false);
        return;
      }

      const orderMap = new Map(
        links.map((l) => [l.question_id, l.question_order ?? 0])
      );

      const sorted = [...questionsData].sort(
        (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0)
      ) as Question[];

      setQuestions(
        sorted.map((q) => ({
          ...q,
          question_type: (q.question_type as Question["question_type"]) || "mcq",
          marks: Number(q.marks) || 1,
        }))
      );

      const duration =
        currentRound.duration_minutes ||
        challengeData.duration_minutes ||
        30;

      setSecondsLeft(duration * 60);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(questionId: string, value: string) {
    if (finished) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(auto = false) {
    if (submitting || finished) return;

    if (!auto) {
      const unanswered = questions.filter((q) => !answers[q.id]?.trim());
      if (unanswered.length > 0) {
        const ok = confirm(
          `يوجد ${unanswered.length} سؤال بدون إجابة. هل تريد التسليم الآن؟`
        );
        if (!ok) return;
      }
    }

    try {
      setSubmitting(true);
      const hasWritten = questions.some((q) => q.question_type === "written");
      let score = 0;
      let total = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;

      for (const q of questions) {
        total += q.marks;
        const userAns = (answers[q.id] || "").trim();

        if (!userAns) {
          unansweredCount++;
          continue;
        }

        if (q.question_type === "written") continue;

        if (userAns.toUpperCase() === (q.correct_answer || "").toUpperCase()) {
          score += q.marks;
          correctCount++;
        } else {
          wrongCount++;
        }
      }

      const percentage =
        total > 0 ? Number(((score / total) * 100).toFixed(2)) : 0;
      const passing = round?.passing_score ?? challenge?.passing_score ?? 50;
      const passed = !hasWritten && percentage >= Number(passing);

      if (studentId && challenge) {
        let participantId: string | null = null;
        const { data: existing } = await supabase
          .from("challenge_participants")
          .select("id")
          .eq("challenge_id", challenge.id)
          .eq("student_id", studentId)
          .maybeSingle();

        if (existing?.id) {
          participantId = existing.id;
        } else {
          const { data: created, error: pError } = await supabase
            .from("challenge_participants")
            .insert({
              challenge_id: challenge.id,
              student_id: studentId,
            })
            .select("id")
            .single();

          if (pError) {
            console.error("Participant error:", pError);
          } else {
            participantId = created?.id || null;
          }
        }

        if (participantId) {
          const { data: existingAttempts } = await supabase
            .from("challenge_attempts")
            .select("id, retry_number")
            .eq("participant_id", participantId)
            .eq("round_id", round?.id || "")
            .order("retry_number", { ascending: false })
            .limit(1);

          const lastRetry = existingAttempts?.[0]?.retry_number || 0;
          const nextRetry = lastRetry + 1;

          const finalScore = hasWritten ? 0 : Number(score) || 0;
          const finalTotal = Number(total) || 0;
          const finalPercentage = hasWritten ? 0 : Number(percentage) || 0;

          const { data: insertedAttempt, error: attemptError } = await supabase
            .from("challenge_attempts")
            .insert({
              challenge_id: challenge.id,
              round_id: round?.id ?? null,
              participant_id: participantId,
              score: finalScore,
              total_score: finalTotal,
              percentage: finalPercentage,
              correct_count: correctCount,
              wrong_count: wrongCount,
              unanswered_count: unansweredCount,
              duration_seconds: 1,
              started_at: new Date().toISOString(),
              finished_at: new Date().toISOString(),
              qualified: false,
              retry_number: nextRetry,
            })
            .select("id")
            .single();

          if (attemptError) {
            console.error("Attempt error:", JSON.stringify(attemptError, null, 2));
          } else if (insertedAttempt?.id) {
            const payload = questions.map((q, index) => {
              const userAns = (answers[q.id] || "").trim();
              const isWritten = q.question_type === "written";
              const isCorrect = !isWritten
                ? userAns.toUpperCase() === (q.correct_answer || "").toUpperCase()
                : false;
              return {
                attempt_id: insertedAttempt.id,
                question_id: q.id,
                student_answer: userAns || null,
                is_correct: isWritten ? false : isCorrect,
                marks_awarded: isWritten ? 0 : isCorrect ? Number(q.marks) || 0 : 0,
                question_order: index + 1,
                answer_time_seconds: 0,
              };
            });

            const { error: ansError } = await supabase
              .from("challenge_attempt_answers")
              .insert(payload);

            if (ansError) {
              console.error("Answers error:", JSON.stringify(ansError, null, 2));
              alert("تم التسليم لكن فشل حفظ تفاصيل الإجابات: " + ansError.message);
            }
          }
        }
      }

      setResult({
        score,
        total,
        percentage,
        passed,
        pendingReview: hasWritten,
      });
      setFinished(true);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "فشل تسليم الإجابات");
    } finally {
      setSubmitting(false);
    }
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  const current = questions[currentIndex];
  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id]?.trim()).length,
    [questions, answers]
  );

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950 text-white"
      >
        جاري تحميل الاختبار...
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-white"
      >
        <p className="text-lg font-bold">{errorMsg}</p>
        <button
          onClick={() => router.push(`/challenges/${challengeId}`)}
          className="mt-6 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950"
        >
          رجوع
        </button>
      </main>
    );
  }

  // شاشة النتيجة
  if (finished && result) {
    if (result.pendingReview) {
      return (
        <main
          dir="rtl"
          className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
              <Clock className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-2xl font-bold">تم تسليم إجاباتك</h1>
            <p className="mt-3 leading-7 text-slate-400">
              يوجد أسئلة مقالية تحتاج مراجعة من الإدارة.
              <br />
              النتيجة ستظهر بعد الانتهاء من التصحيح.
            </p>
            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-300">
              الحالة: في انتظار النتيجة
            </div>
            <button
              onClick={() => router.push(`/challenges/${challengeId}`)}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400"
            >
              العودة للتحدي
            </button>
          </div>
        </main>
      );
    }

    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white"
      >
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
              result.passed
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            <Trophy className="h-8 w-8" />
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            {result.passed ? "أحسنت! نجحت" : "انتهى الاختبار"}
          </h1>

          <p className="mt-2 text-slate-400">{challenge?.title}</p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-800/80 p-3">
              <p className="text-xs text-slate-500">الدرجة</p>
              <p className="mt-1 text-lg font-bold">
                {result.score}/{result.total}
              </p>
            </div>
            <div className="rounded-xl bg-slate-800/80 p-3">
              <p className="text-xs text-slate-500">النسبة</p>
              <p className="mt-1 text-lg font-bold">{result.percentage}%</p>
            </div>
            <div className="rounded-xl bg-slate-800/80 p-3">
              <p className="text-xs text-slate-500">الحالة</p>
              <p
                className={`mt-1 text-lg font-bold ${
                  result.passed ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {result.passed ? "ناجح" : "راسب"}
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push(`/challenges/${challengeId}`)}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للتحدي
          </button>
        </div>
      </main>
    );
  }

  if (!current) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950 text-white"
      >
        لا توجد أسئلة
      </main>
    );
  }

  const options =
    current.question_type === "true_false"
      ? [
          { letter: "A", text: current.option_a || "صح" },
          { letter: "B", text: current.option_b || "خطأ" },
        ]
      : current.question_type === "mcq"
        ? [
            { letter: "A", text: current.option_a },
            { letter: "B", text: current.option_b },
            { letter: "C", text: current.option_c },
            { letter: "D", text: current.option_d },
          ].filter((o) => (o.text && o.text !== "-") || 
            (o.letter === "A" && current.option_a_image) ||
            (o.letter === "B" && current.option_b_image) ||
            (o.letter === "C" && current.option_c_image) ||
            (o.letter === "D" && current.option_d_image)
          )
        : [];

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{challenge?.title}</p>
            <p className="text-xs text-slate-500">
              {round?.title || "الاختبار"} • {answeredCount}/{questions.length} تمت الإجابة
            </p>
          </div>

          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
              secondsLeft !== null && secondsLeft <= 60
                ? "bg-red-500/15 text-red-400"
                : "bg-slate-800 text-cyan-400"
            }`}
          >
            <Clock className="h-4 w-4" />
            {secondsLeft !== null ? formatTime(secondsLeft) : "--:--"}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
        {/* Progress */}
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-cyan-500 transition-all"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>

        {/* Question card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>
              السؤال {currentIndex + 1} من {questions.length}
            </span>
            <span>{current.marks} درجة</span>
          </div>

          <h2 className="text-lg font-bold leading-8 sm:text-xl">
            {current.question}
          </h2>

          {current.image_url && (
            <img
              src={current.image_url}
              alt="صورة السؤال"
              className="mt-4 max-h-64 w-full rounded-xl border border-slate-700 object-contain"
            />
          )}

          {/* MCQ / T&F */}
          {current.question_type !== "written" && (
            <div className="mt-6 space-y-3">
              {options.map((opt) => {
                const selected = answers[current.id] === opt.letter;
                const img =
                  opt.letter === "A"
                    ? current.option_a_image
                    : opt.letter === "B"
                      ? current.option_b_image
                      : opt.letter === "C"
                        ? current.option_c_image
                        : current.option_d_image;
                return (
                  <button
                    key={opt.letter}
                    type="button"
                    onClick={() => selectAnswer(current.id, opt.letter)}
                    className={`flex w-full flex-col gap-2 rounded-xl border px-4 py-3.5 text-right transition ${
                      selected
                        ? "border-cyan-500 bg-cyan-500/15 text-cyan-300"
                        : "border-slate-700 bg-slate-800/50 text-slate-200 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          selected
                            ? "bg-cyan-500 text-slate-950"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {opt.letter}
                      </span>
                      {opt.text && opt.text !== "-" && (
                        <span className="font-bold">{opt.text}</span>
                      )}
                      {selected && (
                        <CheckCircle2 className="mr-auto h-4 w-4 text-cyan-400" />
                      )}
                    </div>
                    {img && (
                      <img
                        src={img}
                        alt={`option-${opt.letter}`}
                        className="max-h-40 rounded-lg object-contain"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Written */}
          {current.question_type === "written" && (
            <textarea
              value={answers[current.id] || ""}
              onChange={(e) => selectAnswer(current.id, e.target.value)}
              rows={5}
              placeholder="اكتب إجابتك هنا..."
              className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
              }
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400"
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {submitting ? "جاري التسليم..." : "تسليم الإجابات"}
            </button>
          )}
        </div>

        {/* Question dots */}
        <div className="flex flex-wrap gap-2 pb-8">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIndex(i)}
              className={`h-9 w-9 rounded-lg text-xs font-bold transition ${
                i === currentIndex
                  ? "bg-cyan-500 text-slate-950"
                  : answers[q.id]?.trim()
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-slate-800 text-slate-400"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}