"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Attempt = {
  id: string;
  score: number;
  total: number;
  percentage: number;
  created_at: string;
  exams: {
    title: string;
  }[];
};

export default function ResultsPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttempts();
  }, []);

  async function loadAttempts() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!student) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("exam_attempts")
      .select(`
        id,
        score,
        total,
        percentage,
        created_at,
        exams (
          title
        )
      `)
      .eq("student_id", student.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAttempts(data as Attempt[]);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        جاري تحميل النتائج...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden">

      <div className="absolute inset-0">
        <img
          src="/images/background.jpg"
          className="w-full h-full object-cover opacity-10"
          alt=""
        />
        <div className="absolute inset-0 bg-slate-950/90" />
      </div>

      <div className="relative max-w-6xl mx-auto py-16 px-6">

        <h1 className="text-5xl font-black mb-10 text-center">
          نتائج الامتحانات
        </h1>

        {attempts.length === 0 ? (
          <div className="rounded-3xl bg-[#081321]/90 border border-cyan-500/20 p-12 text-center">
            <h2 className="text-3xl font-bold">
              لا توجد نتائج حتى الآن
            </h2>
          </div>
        ) : (
          <div className="space-y-6">

            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="rounded-3xl bg-[#081321]/95 border border-cyan-500/20 p-8 flex flex-col lg:flex-row items-center justify-between gap-6"
              >

                <div className="space-y-2">

                  <h2 className="text-3xl font-black">
                    {attempt.exams?.[0]?.title ?? "امتحان"}
                  </h2>

                  <p className="text-slate-400">
                    {new Date(attempt.created_at).toLocaleDateString("ar-EG")}
                  </p>

                </div>

                <div className="flex gap-6">

                  <div className="text-center">
                    <p className="text-slate-400">
                      الدرجة
                    </p>

                    <h3 className="text-3xl font-black text-cyan-400">
                      {attempt.score}/{attempt.total}
                    </h3>
                  </div>

                  <div className="text-center">
                    <p className="text-slate-400">
                      النسبة
                    </p>

                    <h3
                      className={`text-3xl font-black ${
                        attempt.percentage >= 50
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {Math.round(attempt.percentage)}%
                    </h3>
                  </div>

                </div>

                <Link
                  href={`/results/${attempt.id}`}
                  className="rounded-2xl bg-cyan-600 hover:bg-cyan-500 transition px-8 py-4 font-black"
                >
                  عرض النتيجة
                </Link>

              </div>
            ))}

          </div>
        )}
      </div>
    </main>
  );
}