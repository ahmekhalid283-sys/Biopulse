"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Flag,
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
  correct_answer: string;
  marks: number;
  explanation: string | null;
  image_url: string | null;
  option_a_image: string | null;
  option_b_image: string | null;
  option_c_image: string | null;
  option_d_image: string | null;
};

type AnswerMap = Record<string, string>;

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<string[]>([]);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
    pendingReview: boolean;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);

  const studentIdRef = useRef<string | null>(null);
  const answersRef = useRef<AnswerMap>({});
  const questionsRef = useRef<Question[]>([]);
  const submittingRef = useRef(false);
  const finishedRef = useRef(false);
  const challengeRef = useRef<Challenge | null>(null);
  const roundRef = useRef<Round | null>(null);

  useEffect(() => {
    studentIdRef.current = studentId;
  }, [studentId]);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);
  useEffect(() => {
    challengeRef.current = challenge;
  }, [challenge]);
  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  useEffect(() => {
    if (challengeId) loadQuiz();
  }, [challengeId, roundIdFromUrl]);

  useEffect(() => {
    if (secondsLeft === null || finished || loading) return;
    if (secondsLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const t = setTimeout(
      () => setSecondsLeft((s) => (s !== null ? s - 1 : s)),
      1000
    );
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

      if (student) {
        setStudentId(student.id);
        studentIdRef.current = student.id;
      }

      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .select("id, title, duration_minutes, passing_score, status")
        .eq("id", challengeId)
        .in("status", ["registration", "upcoming", "active"])
        .single();

      if (challengeError || !challengeData) {
        setErrorMsg("التحدي غير متاح");
        return;
      }

      setChallenge(challengeData);
      challengeRef.current = challengeData;

      const { data: roundsData } = await supabase
        .from("challenge_rounds")
        .select("id, round_number, title, duration_minutes, passing_score")
        .eq("challenge_id", challengeId)
        .order("round_number", { ascending: true });

      const currentRound =
        roundsData?.find((r) => r.id === roundIdFromUrl) ||
        roundsData?.[0] ||
        null;

      setRound(currentRound);
      roundRef.current = currentRound;

      if (!currentRound) {
        setErrorMsg("لا توجد أسئلة مرتبطة بهذا التحدي بعد");
        return;
      }

      const { data: links } = await supabase
        .from("challenge_round_questions")
        .select("question_id, question_order")
        .eq("round_id", currentRound.id)
        .order("question_order", { ascending: true });

      if (!links?.length) {
        setErrorMsg("لا توجد أسئلة في هذا الدور");
        return;
      }

      const ids = links.map((l) => l.question_id);
      const { data: questionsData, error: qError } = await supabase
        .from("challenge_questions")
        .select(
          `id, question, question_type,
           option_a, option_b, option_c, option_d,
           option_a_image, option_b_image, option_c_image, option_d_image,
           correct_answer, marks, explanation, image_url`
        )
        .in("id", ids);

      if (qError || !questionsData) {
        setErrorMsg("فشل تحميل الأسئلة");
        return;
      }

      const orderMap = new Map(
        links.map((l) => [l.question_id, l.question_order ?? 0])
      );

      const mapped = ([...questionsData] as Question[])
        .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))
        .map((q) => ({
          ...q,
          question_type: q.question_type || "mcq",
          marks: Number(q.marks) || 1,
        }));

      setQuestions(mapped);
      questionsRef.current = mapped;

      const duration =
        currentRound.duration_minutes ||
        challengeData.duration_minutes ||
        30;
      setSecondsLeft(duration * 60);
    } catch (err: any) {
      setErrorMsg(err?.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(questionId: string, value: string) {
    if (finishedRef.current) return;
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      answersRef.current = next;
      return next;
    });
  }

  function toggleReview(id: string) {
    setReviewQuestions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(auto = false) {
    if (submittingRef.current || finishedRef.current) return;

    const qs = questionsRef.current;
    const ans = answersRef.current;
    const sid = studentIdRef.current;
    const ch = challengeRef.current;
    const rd = roundRef.current;

    if (!auto) {
      const unanswered = qs.filter((q) => !ans[q.id]?.trim());
      if (unanswered.length > 0) {
        const ok = confirm(
          `يوجد ${unanswered.length} سؤال بدون إجابة. هل تريد التسليم الآن؟`
        );
        if (!ok) return;
      }
    }

    try {
      setSubmitting(true);
      submittingRef.current = true;

      const hasWritten = qs.some((q) => q.question_type === "written");
      let score = 0;
      let total = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;

      for (const q of qs) {
        total += q.marks;
        const userAns = (ans[q.id] || "").trim();
        if (!userAns) {
          unansweredCount++;
          continue;
        }
        if (q.question_type === "written") continue;
        if (userAns.toUpperCase() === (q.correct_answer || "").toUpperCase()) {
          score += q.marks;
          correctCount++;
        } else wrongCount++;
      }

      const percentage =
        total > 0 ? Number(((score / total) * 100).toFixed(2)) : 0;
      const passing = rd?.passing_score ?? ch?.passing_score ?? 50;
      const passed = !hasWritten && percentage >= Number(passing);

      if (sid && ch) {
        let participantId: string | null = null;
        const { data: existing } = await supabase
          .from("challenge_participants")
          .select("id")
          .eq("challenge_id", ch.id)
          .eq("student_id", sid)
          .maybeSingle();

        if (existing?.id) participantId = existing.id;
        else {
          const { data: created } = await supabase
            .from("challenge_participants")
            .insert({ challenge_id: ch.id, student_id: sid })
            .select("id")
            .single();
          participantId = created?.id || null;
        }

        if (participantId) {
          const { data: existingAttempts } = await supabase
            .from("challenge_attempts")
            .select("retry_number")
            .eq("participant_id", participantId)
            .eq("round_id", rd?.id || "")
            .order("retry_number", { ascending: false })
            .limit(1);

          const nextRetry = (existingAttempts?.[0]?.retry_number || 0) + 1;

          const { data: insertedAttempt, error: attemptError } = await supabase
            .from("challenge_attempts")
            .insert({
              challenge_id: ch.id,
              round_id: rd?.id ?? null,
              participant_id: participantId,
              score: hasWritten ? 0 : score,
              total_score: total,
              percentage: hasWritten ? 0 : percentage,
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

          if (!attemptError && insertedAttempt?.id) {
            await supabase.from("challenge_attempt_answers").insert(
              qs.map((q, index) => {
                const userAns = (ans[q.id] || "").trim();
                const isWritten = q.question_type === "written";
                const isCorrect = !isWritten
                  ? userAns.toUpperCase() ===
                    (q.correct_answer || "").toUpperCase()
                  : false;
                return {
                  attempt_id: insertedAttempt.id,
                  question_id: q.id,
                  student_answer: userAns || null,
                  is_correct: isWritten ? false : isCorrect,
                  marks_awarded: isWritten
                    ? 0
                    : isCorrect
                      ? Number(q.marks) || 0
                      : 0,
                  question_order: index + 1,
                  answer_time_seconds: 0,
                };
              })
            );
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
      finishedRef.current = true;
    } catch (err: any) {
      if (!auto) alert(err?.message || "فشل التسليم");
    } finally {
      setSubmitting(false);
      submittingRef.current = false;
    }
  }

  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function questionColor(id: string, index: number) {
    if (index === currentIndex)
      return "border-orange-500 bg-orange-500 text-white";
    if (reviewQuestions.includes(id))
      return "border-purple-500 bg-purple-500/20 text-purple-300";
    if (answers[id]?.trim())
      return "border-emerald-600 bg-emerald-600 text-white";
    return "border-slate-700 bg-slate-900 text-slate-400";
  }

  const current = questions[currentIndex];
  const answeredCount = useMemo(
    () => questions.filter((q) => answers[q.id]?.trim()).length,
    [questions, answers]
  );
  const progress =
    questions.length > 0
      ? ((currentIndex + 1) / questions.length) * 100
      : 0;

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#070b14] text-white"
      >
        جاري تحميل الاختبار...
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center bg-[#070b14] p-6 text-white"
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

  if (finished && result) {
    if (result.pendingReview) {
      return (
        <main
          dir="rtl"
          className="flex min-h-screen items-center justify-center bg-[#070b14] p-6 text-white"
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0b111e] p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
              <Clock className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-2xl font-black">تم تسليم إجاباتك</h1>
            <p className="mt-3 leading-7 text-slate-400">
              يوجد أسئلة مقالية — النتيجة بعد التصحيح
            </p>
            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-300">
              في انتظار النتيجة
            </div>
            <button
              onClick={() => router.push(`/challenges/${challengeId}`)}
              className="mt-8 w-full rounded-xl bg-cyan-500 py-3 text-sm font-black text-slate-950"
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
        className="flex min-h-screen items-center justify-center bg-[#070b14] p-6 text-white"
      >
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#0b111e] p-8 text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
              result.passed
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            <Trophy className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-black">
            {result.passed ? "أحسنت! نجحت" : "انتهى الاختبار"}
          </h1>
          <p className="mt-2 text-slate-400">{challenge?.title}</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-900 p-3">
              <p className="text-xs text-slate-500">الدرجة</p>
              <p className="mt-1 text-lg font-bold">
                {result.score}/{result.total}
              </p>
            </div>
            <div className="rounded-xl bg-slate-900 p-3">
              <p className="text-xs text-slate-500">النسبة</p>
              <p className="mt-1 text-lg font-bold">{result.percentage}%</p>
            </div>
            <div className="rounded-xl bg-slate-900 p-3">
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
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-sm font-black text-slate-950"
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
        className="flex min-h-screen items-center justify-center bg-[#070b14] text-white"
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
          ].filter(
            (o) =>
              (o.text && o.text !== "-") ||
              (o.letter === "A" && current.option_a_image) ||
              (o.letter === "B" && current.option_b_image) ||
              (o.letter === "C" && current.option_c_image) ||
              (o.letter === "D" && current.option_d_image)
          )
        : [];

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b14] text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-[#070b14]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold text-cyan-400">BioPulse Challenge</p>
            <h1 className="text-lg font-black sm:text-xl">
              {challenge?.title}
            </h1>
            <p className="text-xs text-slate-500">
              {round?.title || "الاختبار"}
            </p>
          </div>

          <div
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-black ${
              secondsLeft !== null && secondsLeft <= 60
                ? "bg-red-500/15 text-red-400"
                : "bg-slate-900 text-cyan-400"
            }`}
          >
            <Clock className="h-4 w-4" />
            {secondsLeft !== null ? formatTime(secondsLeft) : "--:--"}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6">
          <div className="mb-1 flex justify-between text-xs font-bold text-slate-500">
            <span>
              السؤال {currentIndex + 1} / {questions.length}
            </span>
            <span>{Math.floor(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_280px]">
        {/* Question */}
        <div className="rounded-3xl border border-slate-800 bg-[#0b111e] p-5 sm:p-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-500">
            <span>
              السؤال {currentIndex + 1} من {questions.length}
            </span>
            <span className="rounded-lg bg-blue-500/15 px-2.5 py-1 text-blue-400">
              {current.marks} درجة
            </span>
          </div>

          <h2 className="text-xl font-black leading-9 sm:text-2xl">
            {current.question}
          </h2>

          {current.image_url && (
            <img
              src={current.image_url}
              alt="سؤال"
              className="mt-5 max-h-72 w-full rounded-2xl border border-slate-800 object-contain"
            />
          )}

          {current.question_type !== "written" && (
            <div className="mt-7 space-y-3">
              {options.map((opt) => {
                const selected = answers[current.id] === opt.letter;
                const img =
                  current.question_type === "mcq"
                    ? opt.letter === "A"
                      ? current.option_a_image
                      : opt.letter === "B"
                        ? current.option_b_image
                        : opt.letter === "C"
                          ? current.option_c_image
                          : current.option_d_image
                    : null;

                return (
                  <button
                    key={opt.letter}
                    type="button"
                    onClick={() => selectAnswer(current.id, opt.letter)}
                    className={`flex w-full flex-col gap-2 rounded-2xl border px-4 py-4 text-right transition ${
                      selected
                        ? "border-cyan-500 bg-cyan-500/15 text-cyan-300"
                        : "border-slate-800 bg-[#070b14] text-slate-200 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                          selected
                            ? "bg-cyan-500 text-slate-950"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {opt.letter}
                      </span>
                      {opt.text && opt.text !== "-" && (
                        <span className="font-bold">{opt.text}</span>
                      )}
                      {selected && (
                        <CheckCircle2 className="mr-auto h-5 w-5 text-cyan-400" />
                      )}
                    </div>
                    {img && (
                      <img
                        src={img}
                        alt=""
                        className="max-h-40 rounded-xl object-contain"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {current.question_type === "written" && (
            <textarea
              value={answers[current.id] || ""}
              onChange={(e) => selectAnswer(current.id, e.target.value)}
              rows={6}
              placeholder="اكتب إجابتك هنا..."
              className="mt-7 w-full resize-none rounded-2xl border border-slate-800 bg-[#070b14] px-4 py-4 text-sm leading-7 outline-none focus:border-cyan-500"
            />
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
              السابق
            </button>

            <button
              type="button"
              onClick={() => toggleReview(current.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold ${
                reviewQuestions.includes(current.id)
                  ? "border-purple-500/40 bg-purple-500/15 text-purple-300"
                  : "border-slate-700 bg-slate-900 text-slate-300"
              }`}
            >
              <Flag className="h-4 w-4" />
              مراجعة
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))
                }
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-black text-slate-950"
              >
                التالي
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-black text-slate-950 disabled:opacity-50"
              >
                {submitting ? "جاري التسليم..." : "تسليم الإجابات"}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="h-fit rounded-3xl border border-slate-800 bg-[#0b111e] p-5 lg:sticky lg:top-28">
          <h3 className="text-sm font-black text-white">حالة الطالب</h3>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-900 p-3 text-center">
              <p className="text-xs text-slate-500">تمت الإجابة</p>
              <p className="mt-1 text-xl font-black text-emerald-400">
                {answeredCount}
              </p>
            </div>
            <div className="rounded-xl bg-slate-900 p-3 text-center">
              <p className="text-xs text-slate-500">مراجعة</p>
              <p className="mt-1 text-xl font-black text-purple-400">
                {reviewQuestions.length}
              </p>
            </div>
            <div className="col-span-2 rounded-xl bg-slate-900 p-3 text-center">
              <p className="text-xs text-slate-500">التقدم</p>
              <p className="mt-1 text-xl font-black text-cyan-400">
                {Math.floor(progress)}%
              </p>
            </div>
          </div>

          <h4 className="mt-6 text-sm font-black">خريطة الأسئلة</h4>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`flex h-10 items-center justify-center rounded-xl border text-sm font-bold transition hover:scale-105 ${questionColor(
                  q.id,
                  index
                )}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-600" />
              تمت الإجابة
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-orange-500" />
              السؤال الحالي
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-purple-500" />
              محدد للمراجعة
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-slate-700 bg-slate-900" />
              لم يتم الحل
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}