"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Clock3,
  ChevronRight,
  ChevronLeft,
  Flag,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import { motion } from "framer-motion";

type Question = {
  id: string;
  question: string;
  question_type?: "mcq" | "true_false" | "written";
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
  question_image_url?: string | null;
  option_a_image_url?: string | null;
  option_b_image_url?: string | null;
  option_c_image_url?: string | null;
  option_d_image_url?: string | null;
};

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answersRef = useRef<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [exam, setExam] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [reviewQuestions, setReviewQuestions] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    percentage: number;
    pendingReview: boolean;
  } | null>(null);

  // refs عشان التسليم التلقائي لما الوقت يخلص
  const studentIdRef = useRef("");
  const questionsRef = useRef<Question[]>([]);
  const submittingRef = useRef(false);
  const finishedRef = useRef(false);
  const startTimeRef = useRef(0);
  const examRef = useRef<any>(null);

  useEffect(() => {
    studentIdRef.current = studentId;
  }, [studentId]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    finishedRef.current = finished;
  }, [finished]);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  useEffect(() => {
    examRef.current = exam;
  }, [exam]);

  const current = questions[currentQuestion];

  useEffect(() => {
    if (examId) {
      getStudent();
      loadQuestions();
    }
  }, [examId]);

  useEffect(() => {
    if (!endTime || finished) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        void autoSubmitOnTimeout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, finished]);

  async function getStudent() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("يجب تسجيل الدخول أولاً");
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("students")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (error) {
      alert(error.message);
      return;
    }

    if (!data) {
      alert("لم يتم العثور على الطالب");
      return;
    }

    setStudentId(data.id);
    studentIdRef.current = data.id;
  }

  async function loadQuestions() {
    const { data: examData, error: examError } = await supabase
      .from("exams")
      .select("*")
      .eq("id", examId)
      .single();

    if (examError || !examData) {
      alert(examError?.message || "الاختبار غير موجود");
      setLoading(false);
      router.push("/dashboard");
      return;
    }

    setExam(examData);
    examRef.current = examData;

    const { data: questionsData, error } = await supabase
      .from("exam_questions")
      .select(
        `
        id, question, question_type,
        option_a, option_b, option_c, option_d,
        correct_answer, marks,
        question_image_url,
        option_a_image_url, option_b_image_url,
        option_c_image_url, option_d_image_url
      `
      )
      .eq("exam_id", examId)
      .order("question_order", { ascending: true });

    if (error || !questionsData || questionsData.length === 0) {
      alert(error?.message || "لا توجد أسئلة لهذا الاختبار حالياً");
      setLoading(false);
      return;
    }

    const fixedQuestions: Question[] = questionsData.map((q: any) => {
      const getImageUrl = (url: string | null | undefined) => {
        if (!url) return null;
        if (url.startsWith("http")) return url;
        const { data } = supabase.storage
          .from("question-images")
          .getPublicUrl(url);
        return data.publicUrl;
      };

      return {
        ...q,
        question_image_url: getImageUrl(q.question_image_url),
        option_a_image_url: getImageUrl(q.option_a_image_url),
        option_b_image_url: getImageUrl(q.option_b_image_url),
        option_c_image_url: getImageUrl(q.option_c_image_url),
        option_d_image_url: getImageUrl(q.option_d_image_url),
      };
    });

    setQuestions(fixedQuestions);
    questionsRef.current = fixedQuestions;

    const duration = (examData.duration_minutes ?? 30) * 60;
    const endKey = `exam_end_${examId}`;
    const startKey = `exam_start_${examId}`;
    const savedEnd = localStorage.getItem(endKey);
    const savedStart = localStorage.getItem(startKey);

    if (savedEnd && savedStart) {
      setEndTime(Number(savedEnd));
      setStartTime(Number(savedStart));
      startTimeRef.current = Number(savedStart);
      setTimeLeft(
        Math.max(0, Math.floor((Number(savedEnd) - Date.now()) / 1000))
      );
    } else {
      const start = Date.now();
      const end = start + duration * 1000;
      localStorage.setItem(startKey, start.toString());
      localStorage.setItem(endKey, end.toString());
      setStartTime(start);
      startTimeRef.current = start;
      setEndTime(end);
      setTimeLeft(duration);
    }

    setLoading(false);
  }

  function chooseAnswer(questionId: string, answer: string) {
    if (finishedRef.current) return;
    setAnswers((prev) => {
      const updated = { ...prev, [questionId]: answer };
      answersRef.current = updated;
      return updated;
    });
  }

  function nextQuestion() {
    if (currentQuestion < questions.length - 1)
      setCurrentQuestion(currentQuestion + 1);
  }

  function prevQuestion() {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  }

  function toggleReview(id: string) {
    setReviewQuestions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function questionColor(id: string, index: number) {
    if (reviewQuestions.includes(id))
      return "border-purple-500 text-purple-300";
    if (answers[id]) return "bg-green-600 text-white border-green-600";
    if (index === currentQuestion)
      return "bg-orange-500 text-white border-orange-500";
    return "border-slate-700 text-slate-400 bg-slate-900/50";
  }

  async function autoSubmitOnTimeout() {
    if (finishedRef.current || submittingRef.current) return;

    // لو studentId لسه مش جاهز، حاول تجيبه
    if (!studentIdRef.current) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("students")
          .select("id")
          .eq("auth_id", user.id)
          .maybeSingle();

        if (data?.id) {
          studentIdRef.current = data.id;
          setStudentId(data.id);
        }
      }
    }

    if (!studentIdRef.current) {
      alert("انتهى الوقت وتعذر حفظ النتيجة: بيانات الطالب غير جاهزة");
      return;
    }

    await submitExam(true);
  }

  async function submitExam(forceSubmit = false) {
    if (submittingRef.current || finishedRef.current) return;

    const sid = studentIdRef.current || studentId;
    if (!sid) {
      if (!forceSubmit) {
        alert("بيانات الطالب غير جاهزة");
      }
      return;
    }

    const finalAnswers = answersRef.current;
    const qs = questionsRef.current.length
      ? questionsRef.current
      : questions;
    const examData = examRef.current || exam;
    const started = startTimeRef.current || startTime;

    if (
      !forceSubmit &&
      Object.keys(finalAnswers).length !== qs.length &&
      timeLeft > 0
    ) {
      const ok = window.confirm(
        "لم تقم بالإجابة على جميع الأسئلة. هل أنت متأكد من رغبتك في تسليم الاختبار؟"
      );
      if (!ok) return;
    }

    setSubmitting(true);
    submittingRef.current = true;

    let calculatedScore = 0;
    const hasWritten = qs.some(
      (q) => (q.question_type || "mcq") === "written"
    );

    qs.forEach((q) => {
      const ans = finalAnswers[q.id];
      const type = q.question_type || "mcq";
      if (type === "written") return;
      if (ans && ans === q.correct_answer) {
        calculatedScore += Number(q.marks) || 0;
      }
    });

    const totalFromQuestions = qs.reduce(
      (s, q) => s + Number(q.marks || 0),
      0
    );
    const total = totalFromQuestions || examData?.total_score || 0;
    const percentage =
      total > 0 ? Number(((calculatedScore / total) * 100).toFixed(2)) : 0;
    const duration = Math.floor((Date.now() - started) / 1000);

    const { data: insertedAttempt, error } = await supabase
      .from("exam_attempts")
      .insert({
        student_id: sid,
        exam_id: examId,
        score: calculatedScore,
        total,
        percentage,
        duration_seconds: duration,
        started_at: new Date(started),
        finished_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      setSubmitting(false);
      submittingRef.current = false;
      alert(error.message);
      return;
    }

    const answersToInsert = qs.map((q) => {
      const ans = finalAnswers[q.id] || null;
      const isWritten = (q.question_type || "mcq") === "written";
      return {
        attempt_id: insertedAttempt.id,
        question_id: q.id,
        student_answer: ans,
        is_correct: isWritten ? null : ans === q.correct_answer,
        marks_awarded: isWritten
          ? 0
          : ans === q.correct_answer
            ? Number(q.marks) || 0
            : 0,
      };
    });

    const { error: answersError } = await supabase
      .from("exam_answers")
      .insert(answersToInsert);

    if (answersError) {
      setSubmitting(false);
      submittingRef.current = false;
      alert(answersError.message);
      return;
    }

    localStorage.removeItem(`exam_end_${examId}`);
    localStorage.removeItem(`exam_start_${examId}`);

    setResult({
      score: calculatedScore,
      total,
      percentage,
      pendingReview: hasWritten,
    });
    setFinished(true);
    finishedRef.current = true;
    setSubmitting(false);
    submittingRef.current = false;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <h2 className="animate-pulse text-3xl font-bold">
          جارٍ تحميل الامتحان...
        </h2>
      </main>
    );
  }

  if (finished && result) {
    if (result.pendingReview) {
      return (
        <main
          dir="rtl"
          className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
              <Clock3 className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-2xl font-bold">تم تسليم إجاباتك</h1>
            <p className="mt-3 leading-7 text-slate-400">
              يوجد أسئلة مقالية تحتاج مراجعة من الإدارة.
              <br />
              النتيجة النهائية ستظهر بعد التصحيح.
            </p>
            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-300">
              الحالة: في انتظار التصحيح
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-8 w-full rounded-xl bg-cyan-500 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400"
            >
              العودة للرئيسية
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <Trophy className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">انتهى الاختبار</h1>
          <p className="mt-2 text-slate-400">{exam?.title}</p>
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
              <p className="mt-1 text-lg font-bold text-cyan-400">تم</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-8 w-full rounded-xl bg-cyan-500 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400"
          >
            العودة للرئيسية
          </button>
        </div>
      </main>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const progress =
    questions.length === 0 ? 0 : (answeredCount / questions.length) * 100;

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative min-h-screen overflow-hidden bg-slate-950 p-6 text-white lg:p-12"
      dir="rtl"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/30 via-slate-950/80 to-slate-950" />

      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-cyan-500/25 bg-[#081321]/90 p-6 backdrop-blur-xl md:flex-row">
          <div>
            <h1 className="text-4xl font-black md:text-5xl">BioPulse Exam</h1>
            <p className="mt-3 text-slate-400">Biology Online Assessment</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-cyan-500/30 bg-slate-900/80 px-6 py-3">
            <Clock3 className="h-6 w-6 animate-pulse text-cyan-400" />
            <span className="font-mono text-xl font-bold text-cyan-300">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-500/20 bg-[#081321]/90 p-5">
          <div className="mb-3 flex justify-between">
            <span className="font-bold text-cyan-400">تقدمك</span>
            <span className="text-slate-400">
              {answeredCount} / {questions.length}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="space-y-6 lg:col-span-3">
            {current && (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 rounded-3xl border border-cyan-500/20 bg-[#081321]/95 p-8 shadow-2xl backdrop-blur-xl"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400">
                    السؤال {currentQuestion + 1} من {questions.length}
                  </span>
                  <button
                    onClick={() => toggleReview(current.id)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-1.5 text-sm font-bold transition ${
                      reviewQuestions.includes(current.id)
                        ? "border-purple-500 bg-purple-600 text-white"
                        : "border-slate-700 text-slate-400 hover:border-purple-500"
                    }`}
                  >
                    <Flag className="h-4 w-4" />
                    للمراجعة
                  </button>
                </div>

                <div className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-cyan-400">Question</p>
                      <h2 className="text-3xl font-black">
                        {currentQuestion + 1}
                      </h2>
                    </div>
                    <div className="text-left">
                      <p className="text-slate-400">Marks</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {current.marks}
                      </p>
                    </div>
                  </div>
                  <p className="text-xl leading-9">{current.question}</p>
                </div>

                {current.question_image_url && (
                  <div className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-900 p-3">
                    <img
                      src={current.question_image_url}
                      alt="صورة السؤال"
                      className="mx-auto max-h-[500px] w-auto max-w-full rounded-xl object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}

                {current.question_type !== "written" && (
                  <div className="space-y-3 pt-2">
                    {(current.question_type === "true_false"
                      ? [
                          {
                            key: "A",
                            text: current.option_a || "صح",
                            image: current.option_a_image_url,
                          },
                          {
                            key: "B",
                            text: current.option_b || "خطأ",
                            image: current.option_b_image_url,
                          },
                        ]
                      : [
                          {
                            key: "A",
                            text: current.option_a,
                            image: current.option_a_image_url,
                          },
                          {
                            key: "B",
                            text: current.option_b,
                            image: current.option_b_image_url,
                          },
                          {
                            key: "C",
                            text: current.option_c,
                            image: current.option_c_image_url,
                          },
                          {
                            key: "D",
                            text: current.option_d,
                            image: current.option_d_image_url,
                          },
                        ]
                    )
                      .filter((o) => o.text && o.text !== "-")
                      .map((option) => {
                        const isSelected = answers[current.id] === option.key;
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() =>
                              chooseAnswer(current.id, option.key)
                            }
                            className={`flex w-full items-center gap-5 rounded-2xl border p-5 text-right transition-all duration-300 ${
                              isSelected
                                ? "border-cyan-400 bg-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,.25)]"
                                : "border-slate-800 hover:border-cyan-500 hover:bg-slate-900"
                            }`}
                          >
                            <span
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-black ${
                                isSelected
                                  ? "bg-cyan-500 text-white"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              {option.key}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="block text-lg">
                                {option.text}
                              </span>
                              {option.image && (
                                <img
                                  src={option.image}
                                  alt=""
                                  className="mt-3 max-h-[220px] max-w-full rounded-xl object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}

                {current.question_type === "written" && (
                  <textarea
                    value={answers[current.id] || ""}
                    onChange={(e) => chooseAnswer(current.id, e.target.value)}
                    rows={5}
                    placeholder="اكتب إجابتك المفصلة هنا..."
                    className="w-full resize-y rounded-2xl border border-slate-700 bg-slate-900 p-4 text-base text-white outline-none focus:border-cyan-500"
                  />
                )}

                <div className="flex items-center justify-between border-t border-slate-800 pt-6">
                  <Button
                    onClick={prevQuestion}
                    disabled={currentQuestion === 0}
                    className="rounded-xl bg-slate-800 px-6 text-white hover:bg-slate-700"
                  >
                    <ChevronRight className="ml-2 h-5 w-5" />
                    السابق
                  </Button>

                  {currentQuestion < questions.length - 1 ? (
                    <Button
                      onClick={nextQuestion}
                      className="rounded-xl bg-cyan-600 px-6 font-bold text-white hover:bg-cyan-700"
                    >
                      التالي
                      <ChevronLeft className="mr-2 h-5 w-5" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => submitExam()}
                      disabled={submitting || !studentId}
                      className="rounded-xl bg-red-600 px-8 font-bold text-white shadow-[0_0_30px_rgba(255,0,0,.3)] hover:bg-red-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="ml-2 h-5 w-5" />
                      {submitting
                        ? "جاري الإرسال..."
                        : !studentId
                          ? "جاري تحميل بيانات الطالب..."
                          : "إنهاء وتسليم الاختبار"}
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-6 rounded-3xl border border-cyan-500/20 bg-[#081321]/90 p-6">
              <h3 className="text-xl font-bold">Student Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-900 p-4 text-center">
                  <p className="text-sm text-slate-400">Answered</p>
                  <p className="text-2xl font-bold text-green-400">
                    {answeredCount}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900 p-4 text-center">
                  <p className="text-sm text-slate-400">Remaining</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {questions.length - answeredCount}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900 p-4 text-center">
                  <p className="text-sm text-slate-400">Review</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {reviewQuestions.length}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900 p-4 text-center">
                  <p className="text-sm text-slate-400">Progress</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {Math.floor(progress)}%
                  </p>
                </div>
              </div>

              <h3 className="pt-2 text-lg font-bold text-slate-200">
                خريطة الأسئلة
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(index)}
                    className={`flex h-10 items-center justify-center rounded-xl border text-sm font-bold transition hover:scale-110 ${questionColor(
                      q.id,
                      index
                    )}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-green-600" />
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
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}