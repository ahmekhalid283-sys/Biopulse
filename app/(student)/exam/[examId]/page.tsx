"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

import {
  Clock3,
  ChevronRight,
  ChevronLeft,
  Flag,
  CheckCircle2,
} from "lucide-react";

import { motion } from "framer-motion";

type Question = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
  image_url?: string | null;
};

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [startTime, setStartTime] = useState(0);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [reviewQuestions, setReviewQuestions] = useState<string[]>([]);

  const current = questions[currentQuestion];

  useEffect(() => {
    if (examId) {
      getStudent();
      loadQuestions();
    }
  }, [examId]);

  useEffect(() => {
    if (!endTime) return;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((endTime - Date.now()) / 1000)
      );

      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        submitExam();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  async function getStudent() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("يجب تسجيل الدخول أولاً");
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
  }

  async function loadQuestions() {
    const { data: exam, error: examError } = await supabase
      .from("exams")
      .select("duration_minutes")
      .eq("id", examId)
      .single();

    if (examError) {
      alert(examError.message);
      setLoading(false);
      return;
    }

    const { data: questionsData, error } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", examId)
      .order("question_order");

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setQuestions(questionsData || []);

    const duration = (exam.duration_minutes ?? 30) * 60;
    const endKey = `exam_end_${examId}`;
    const startKey = `exam_start_${examId}`;

    const savedEnd = localStorage.getItem(endKey);
    const savedStart = localStorage.getItem(startKey);

    if (savedEnd && savedStart) {
      setEndTime(Number(savedEnd));
      setStartTime(Number(savedStart));

      setTimeLeft(
        Math.max(
          0,
          Math.floor((Number(savedEnd) - Date.now()) / 1000)
        )
      );
    } else {
      const start = Date.now();
      const end = start + duration * 1000;

      localStorage.setItem(startKey, start.toString());
      localStorage.setItem(endKey, end.toString());

      setStartTime(start);
      setEndTime(end);
      setTimeLeft(duration);
    }

    setLoading(false);
  }

  function chooseAnswer(questionId: string, answer: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  }

  function nextQuestion() {
    if (currentQuestion < questions.length - 1)
      setCurrentQuestion(currentQuestion + 1);
  }

  function prevQuestion() {
    if (currentQuestion > 0)
      setCurrentQuestion(currentQuestion - 1);
  }

  function toggleReview(id: string) {
    if (reviewQuestions.includes(id)) {
      setReviewQuestions(
        reviewQuestions.filter((q) => q !== id)
      );
    } else {
      setReviewQuestions([...reviewQuestions, id]);
    }
  }

  function questionColor(id: string, index: number) {
    if (reviewQuestions.includes(id))
      return "border-purple-500 text-purple-300";

    if (answers[id])
      return "bg-green-600 text-white border-green-600";

    if (index === currentQuestion)
      return "bg-orange-500 text-white border-orange-500";

    return "border-slate-700 text-slate-400 bg-slate-900/50";
  }

  async function submitExam() {
    if (submitting) return;

    if (!studentId) {
      alert("studentId فارغ");
      return;
    }

    if (
      Object.keys(answers).length !== questions.length &&
      timeLeft > 0
    ) {
      alert("أجب عن جميع الأسئلة أولاً");
      return;
    }

    setSubmitting(true);

    let calculatedScore = 0;

    questions.forEach((q) => {
      if (answers[q.id] === q.correct_answer) {
        calculatedScore += q.marks;
      }
    });

    const { data: examData } = await supabase
      .from("exams")
      .select("total_score")
      .eq("id", examId)
      .single();

    const total = examData?.total_score ?? calculatedScore;
    const percentage = total > 0 ? (calculatedScore / total) * 100 : 0;
    const duration = Math.floor((Date.now() - startTime) / 1000);

    const { data: insertedAttempt, error } = await supabase
      .from("exam_attempts")
      .insert({
        student_id: studentId,
        exam_id: examId,
        score: calculatedScore,
        total,
        percentage,
        duration_seconds: duration,
        started_at: new Date(startTime),
        finished_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      setSubmitting(false);
      alert(error.message);
      return;
    }

    const answersToInsert = questions.map((q) => ({
      attempt_id: insertedAttempt.id,
      question_id: q.id,
      student_answer: answers[q.id] || null,
      is_correct: answers[q.id] === q.correct_answer,
    }));

    const { data: insertedAnswers, error: answersError } = await supabase
      .from("exam_answers")
      .insert(answersToInsert)
      .select();
    
    console.log("answersToInsert:", answersToInsert);
    console.log("insertedAnswers:", insertedAnswers);
    console.log("answersError:", answersError);
    
    if (answersError) {
      alert(answersError.message);
      setSubmitting(false);
      return;
    }

    const { data: attempts } = await supabase
      .from("exam_attempts")
      .select("percentage")
      .eq("student_id", studentId);

    if (attempts) {
      const totalExams = attempts.length;
      const averageScore =
        attempts.reduce((sum, a) => sum + Number(a.percentage), 0) / totalExams;

      await supabase
        .from("students")
        .update({
          total_exams: totalExams,
          average_score: Number(averageScore.toFixed(2)),
        })
        .eq("id", studentId);
    }

    const { data: studentsList } = await supabase
      .from("students")
      .select("id, average_score")
      .order("average_score", { ascending: false });

    if (studentsList) {
      for (let i = 0; i < studentsList.length; i++) {
        await supabase
          .from("students")
          .update({ rank: i + 1 })
          .eq("id", studentsList[i].id);
      }
    }

    setSubmitting(false);

    localStorage.removeItem(`exam_end_${examId}`);
    localStorage.removeItem(`exam_start_${examId}`);

    console.log("Inserted Attempt:", insertedAttempt);
    router.push(`/results/${insertedAttempt.id}`);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <h2 className="text-3xl font-bold animate-pulse">
          جارٍ تحميل الامتحان...
        </h2>
      </main>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const progress =
    questions.length === 0
      ? 0
      : (answeredCount / questions.length) * 100;

  return (
    <motion.main
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.6,
      }}
      className="min-h-screen bg-slate-950 text-white relative overflow-hidden p-6 lg:p-12"
    >
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/background.jpg"
          className="w-full h-full object-cover opacity-10"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/80 to-slate-950" />
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#081321]/90 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6">
          <div>
            <h1 className="text-5xl font-black">BioPulse Exam</h1>
            <p className="mt-3 text-slate-400">Biology Online Assessment</p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 border border-cyan-500/30 px-6 py-3 rounded-2xl">
            <Clock3 className="text-cyan-400 w-6 h-6 animate-pulse" />
            <span className="text-xl font-bold text-cyan-300 font-mono">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-[#081321]/90 border border-cyan-500/20 p-5">
          <div className="flex justify-between mb-3">
            <span className="font-bold text-cyan-400">تقدمك</span>
            <span className="text-slate-400">
              {answeredCount} / {questions.length}
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              animate={{
                width: `${progress}%`,
              }}
              transition={{
                duration: 0.5,
              }}
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {current && (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="rounded-3xl bg-[#081321]/95 backdrop-blur-xl border border-cyan-500/20 p-8 shadow-2xl space-y-6"
              >
                <div className="flex justify-between items-center">
                  <span className="text-cyan-400 font-bold">
                    السؤال {currentQuestion + 1} من {questions.length}
                  </span>

                  <button
                    onClick={() => toggleReview(current.id)}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border text-sm font-bold transition ${
                      reviewQuestions.includes(current.id)
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "border-slate-700 text-slate-400 hover:border-purple-500"
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                    للمراجعة
                  </button>
                </div>

                <div className="rounded-2xl bg-slate-900 border border-cyan-500/20 p-6">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <p className="text-cyan-400 text-sm">Question</p>
                      <h2 className="text-3xl font-black">
                        {currentQuestion + 1}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400">Marks</p>
                      <p className="text-2xl text-yellow-400 font-bold">
                        {current.marks}
                      </p>
                    </div>
                  </div>
                  <p className="text-xl leading-9">{current.question}</p>
                </div>

                {current.image_url && (
                  <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-80 flex justify-center bg-slate-900">
                    <img src={current.image_url} alt="" className="object-contain max-h-80" />
                  </div>
                )}

                <div className="space-y-3 pt-4">
                  {[
                    { key: "A", text: current.option_a },
                    { key: "B", text: current.option_b },
                    { key: "C", text: current.option_c },
                    { key: "D", text: current.option_d },
                  ].map((option) => {
                    const isSelected = answers[current.id] === option.key;
                    return (
                      <button
                        key={option.key}
                        onClick={() => chooseAnswer(current.id, option.key)}
                        className={`group w-full rounded-2xl border p-5 transition-all duration-300 flex items-center gap-5 ${
                          isSelected
                            ? "bg-cyan-500/20 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,.25)]"
                            : "border-slate-800 hover:border-cyan-500 hover:bg-slate-900"
                        }`}
                      >
                        <span
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${
                            isSelected ? "bg-cyan-500 text-white" : "bg-slate-800"
                          }`}
                        >
                          {option.key}
                        </span>
                        <span className="text-lg">{option.text}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-slate-800">
                  <Button
                    onClick={prevQuestion}
                    disabled={currentQuestion === 0}
                    className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-6"
                  >
                    <ChevronRight className="w-5 h-5 ml-2" />
                    السابق
                  </Button>

                  {currentQuestion < questions.length - 1 ? (
                    <Button
                      onClick={nextQuestion}
                      className="rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white px-6 font-bold"
                    >
                      التالي
                      <ChevronLeft className="w-5 h-5 mr-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={submitExam}
                      disabled={submitting || !studentId}
                      className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-8 font-bold shadow-[0_0_30px_rgba(255,0,0,.3)] disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5 ml-2" />
                      {submitting ? "جاري الإرسال..." : !studentId ? "جاري تحميل بيانات الطالب..." : "إنهاء وتسليم الاختبار"}
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-[#081321]/90 border border-cyan-500/20 p-6 space-y-6">
              <h3 className="text-xl font-bold">Student Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-900 p-4 text-center">
                  <p className="text-slate-400 text-sm">Answered</p>
                  <p className="text-2xl font-bold text-green-400">{answeredCount}</p>
                </div>
                <div className="rounded-xl bg-slate-900 p-4 text-center">
                  <p className="text-slate-400 text-sm">Remaining</p>
                  <p className="text-2xl font-bold text-orange-400">
                    {questions.length - answeredCount}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900 p-4 text-center">
                  <p className="text-slate-400 text-sm">Review</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {reviewQuestions.length}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900 p-4 text-center">
                  <p className="text-slate-400 text-sm">Progress</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {Math.floor(progress)}%
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-200 pt-2">خريطة الأسئلة</h3>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(index)}
                    className={`h-10 rounded-xl border font-bold text-sm transition-all duration-300 hover:scale-110 flex items-center justify-center ${questionColor(
                      q.id,
                      index
                    )}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-600"></span>
                  <span>تمت الإجابة</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-orange-500"></span>
                  <span>السؤال الحالي</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  <span>محدد للمراجعة</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-slate-700 bg-slate-900"></span>
                  <span>لم يتم الحل</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.main>
  );
}