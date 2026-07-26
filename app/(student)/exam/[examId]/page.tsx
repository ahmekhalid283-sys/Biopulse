"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type Question = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks: number;
};

export default function ExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [startTime, setStartTime] = useState(0);

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
    console.log("Current User:", user);

    if (!user) {
      alert("يجب تسجيل الدخول أولاً");
      return;
    }

    const { data, error } = await supabase
      .from("students")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    console.log("Student:", data);
    console.log("Error:", error);


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
    // تحميل بيانات الامتحان
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

    // تحميل الأسئلة
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

    const percentage = (calculatedScore / total) * 100;
    const duration = Math.floor((Date.now() - startTime) / 1000);
    // 1. حفظ محاولة الامتحان
    const { error } = await supabase.from("exam_attempts").insert({
      student_id: studentId,
      exam_id: examId,
      score: calculatedScore,
      total,
      percentage,
      duration_seconds: duration,
      started_at: new Date(startTime),
      finished_at: new Date(),
    });

    if (error) {
      setSubmitting(false);
      alert(error.message);
      return;
    }

    // 2. تحديث إحصائيات الطالب (عدد الامتحانات ومتوسط الدرجات)
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

    // 3. إعادة ترتيب الطلاب بناءً على متوسط الدرجات
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
  router.push(
    `/results?exam=${examId}&score=${calculatedScore}&total=${total}&percentage=${percentage.toFixed(2)}`
  );
  }

  if (loading) {
    return <p className="p-10 text-center">جارٍ تحميل الامتحان...</p>;
  }
  

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="mb-6 rounded-lg bg-red-100 p-4 text-center text-2xl font-bold">
        الوقت المتبقي: {Math.floor(timeLeft / 60)}:
        {(timeLeft % 60).toString().padStart(2, "0")}
      </div>

      <h1 className="text-3xl font-bold mb-8">الامتحان</h1>

      <div className="space-y-8">
        {questions.map((q, index) => (
          <div key={q.id} className="rounded-xl border p-6 bg-white shadow-sm">
            <h2 className="font-bold mb-5 text-lg">
              {index + 1}. {q.question} <span className="text-sm text-gray-500 font-normal">({q.marks} درجات)</span>
            </h2>

            <div className="space-y-3">
              <label className="flex items-center cursor-pointer p-2 rounded hover:bg-gray-50">
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === "A"}
                  onChange={() => chooseAnswer(q.id, "A")}
                />
                <span className="mr-2">A) {q.option_a}</span>
              </label>

              <label className="flex items-center cursor-pointer p-2 rounded hover:bg-gray-50">
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === "B"}
                  onChange={() => chooseAnswer(q.id, "B")}
                />
                <span className="mr-2">B) {q.option_b}</span>
              </label>

              <label className="flex items-center cursor-pointer p-2 rounded hover:bg-gray-50">
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === "C"}
                  onChange={() => chooseAnswer(q.id, "C")}
                />
                <span className="mr-2">C) {q.option_c}</span>
              </label>

              <label className="flex items-center cursor-pointer p-2 rounded hover:bg-gray-50">
                <input
                  type="radio"
                  name={q.id}
                  checked={answers[q.id] === "D"}
                  onChange={() => chooseAnswer(q.id, "D")}
                />
                <span className="mr-2">D) {q.option_d}</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Button className="w-full" onClick={submitExam} disabled={submitting}>
          {submitting ? "جارٍ تسليم الامتحان..." : "إنهاء الامتحان"}
        </Button>
      </div>

      {score !== null && (
        <div className="mt-6 rounded-xl bg-green-100 p-5 text-center">
          <h2 className="text-2xl font-bold text-green-700">
            🎉 درجتك: {score}
          </h2>
        </div>
      )}
    </main>
  );
}