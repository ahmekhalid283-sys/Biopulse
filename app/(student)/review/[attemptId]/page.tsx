"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, XCircle } from "lucide-react";

type ReviewQuestion = {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
  image_url: string | null;
  marks: number;
};

type ReviewAnswer = {
  question_id: string;
  student_answer: string;
  is_correct: boolean;
};

export default function ReviewPage() {
  const { attemptId } = useParams<{ attemptId: string }>();

  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, ReviewAnswer>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReview();
  }, []);

  async function loadReview() {
    const { data: attempt } = await supabase
      .from("exam_attempts")
      .select("exam_id")
      .eq("id", attemptId)
      .single();

    if (!attempt) {
      setLoading(false);
      return;
    }

    const { data: qs } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", attempt.exam_id)
      .order("question_order");

    const { data: ans } = await supabase
      .from("exam_answers")
      .select("*")
      .eq("attempt_id", attemptId);

    const map: Record<string, ReviewAnswer> = {};

    ans?.forEach((a) => {
      map[a.question_id] = a;
    });

    setQuestions(qs || []);
    setAnswers(map);

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        جارٍ تحميل المراجعة...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-5xl font-black text-cyan-400">
            مراجعة الإجابات
          </h1>
          <Link
            href="/dashboard"
            className="rounded-xl bg-slate-900 border border-cyan-500/30 px-6 py-3 font-bold hover:bg-slate-800 transition-all"
          >
            العودة للوحة التحكم
          </Link>
        </div>

        {questions.map((q, index) => {
          const answer = answers[q.id];

          return (
            <div
              key={q.id}
              className="rounded-3xl border border-cyan-500/20 bg-[#081321] p-8"
            >
              <div className="flex justify-between items-center mb-5">

                <h2 className="text-2xl font-bold">
                  السؤال {index + 1}
                </h2>

                {answer?.is_correct ? (
                  <div className="flex items-center gap-2 text-green-400 font-bold">
                    <CheckCircle2 />
                    صحيح
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 font-bold">
                    <XCircle />
                    خطأ
                  </div>
                )}
              </div>

              <p className="text-xl mb-6">
                {q.question}
              </p>

              {q.image_url && (
                <img
                  src={q.image_url}
                  className="rounded-2xl mb-6"
                  alt=""
                />
              )}

              {[
                ["A", q.option_a],
                ["B", q.option_b],
                ["C", q.option_c],
                ["D", q.option_d],
              ].map(([key, text]) => {
                const isCorrect = q.correct_answer === key;
                const isStudent = answer?.student_answer === key;

                return (
                  <div
                    key={key}
                    className={`mb-3 rounded-xl border p-4 ${
                      isCorrect
                        ? "border-green-500 bg-green-500/10"
                        : isStudent
                        ? "border-red-500 bg-red-500/10"
                        : "border-slate-700"
                    }`}
                  >
                    <span className="font-bold mr-2">
                      {key})
                    </span>

                    {text}
                  </div>
                );
              })}

              <div className="mt-6 rounded-2xl bg-slate-900 p-5 border border-cyan-500/20">

                <h3 className="font-bold text-cyan-400 mb-3">
                  التفسير
                </h3>

                <p className="text-slate-300 leading-8">
                  {q.explanation || "لا يوجد تفسير لهذا السؤال."}
                </p>

              </div>

            </div>
          );
        })}
      </div>
    </main>
  );
}