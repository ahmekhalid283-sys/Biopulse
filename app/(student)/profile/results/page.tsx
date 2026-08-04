"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Attempt = {
  id: string;
  score: number;
  total: number;
  percentage: number;
  duration_seconds: number;
  created_at: string;
  exams: {
    id: string;
    title: string;
    lectures: {
      title: string;
      chapters: {
        title: string;
      } | null;
    } | null;
  } | null;
};

export default function ResultsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!student) return;

    const { data, error } = await supabase
      .from("exam_attempts")
      .select(`
        id,
        score,
        total,
        percentage,
        duration_seconds,
        created_at,
        exams!exam_attempts_exam_id_fkey(
          id,
          title,
          lectures(
            title,
            chapters(
              title
            )
          )
        )
      `)
      .eq("student_id", student.id)
      .order("created_at", { ascending: false });

    console.log("Attempts:", data);
    console.log("Error:", error);

    setAttempts((data as Attempt[]) || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        جاري تحميل النتائج...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <div className="mx-auto max-w-5xl">

        <h1 className="mb-10 text-center text-5xl font-black text-cyan-400">
          نتائج الامتحانات
        </h1>

        <div className="space-y-6">

          {attempts.length === 0 && (
            <div className="rounded-3xl bg-slate-900 p-10 text-center text-slate-400">
              لا توجد امتحانات حتى الآن
            </div>
          )}

          {attempts.map((attempt) => {

            const color =
              attempt.percentage >= 85
                ? "text-green-400"
                : attempt.percentage >= 60
                ? "text-yellow-400"
                : "text-red-400";

            return (
              <div
                key={attempt.id}
                className="rounded-3xl border border-cyan-500/20 bg-slate-900 p-8"
              >
                <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-center">

                  <div>

                    <h2 className="text-3xl font-bold text-white">
                      {attempt.exams?.title}
                    </h2>

                    <p className="mt-2 text-cyan-400">
                      📚 {attempt.exams?.lectures?.chapters?.title}
                    </p>

                    <p className="mt-1 text-slate-400">
                      🎥 {attempt.exams?.lectures?.title}
                    </p>

                    <p className="mt-3 text-slate-400 text-sm">
                      {new Date(
                        attempt.created_at
                      ).toLocaleDateString("ar-EG")}
                    </p>

                  </div>

                  <div className="text-center">

                    <p className="text-slate-400">
                      الدرجة
                    </p>

                    <p className="text-3xl font-black text-cyan-400">
                      {attempt.score} / {attempt.total}
                    </p>

                  </div>

                  <div className="text-center">

                    <p className="text-slate-400">
                      النسبة
                    </p>

                    <p className={`text-3xl font-black ${color}`}>
                      {attempt.percentage}%
                    </p>

                  </div>

                  <div className="text-center">

                    <p className="text-slate-400">
                      الوقت
                    </p>

                    <p className="text-3xl font-black text-white">
                      {Math.floor(attempt.duration_seconds / 60)} د
                    </p>

                  </div>

                </div>

                <Link
                  href={`/review/${attempt.id}`}
                  className="mt-8 block rounded-2xl bg-cyan-500 py-3 text-center font-bold text-white hover:bg-cyan-600"
                >
                  مراجعة الحل
                </Link>

              </div>
            );
          })}

        </div>

      </div>
    </main>
  );
}