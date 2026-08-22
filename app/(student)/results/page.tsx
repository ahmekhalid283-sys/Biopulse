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
    id: string;
    title: string;

    lectures: {
      id: string;
      title: string;

      chapters: {
        id: string;
        title: string;
      };
    };
  };
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
        exams(
          id,
          title,
          lectures(
            id,
            title,
            chapters(
              id,
              title
            )
          )
        )
      `)
      .eq("student_id", student.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAttempts(data as unknown as Attempt[]);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        جاري تحميل النتائج...
      </div>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 text-white relative overflow-hidden text-right">
      <div className="absolute inset-0">
        <img
          src="/images/background.jpg"
          className="w-full h-full object-cover opacity-10"
          alt=""
        />
        <div className="absolute inset-0 bg-slate-950/90" />
      </div>

      <div className="relative max-w-6xl mx-auto py-16 px-6">

        {/* ================= HEADER / BACK BUTTON ================= */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-block rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-3 text-base font-bold text-cyan-400 transition hover:bg-cyan-500/20"
          >
            ← العودة للرئيسية
          </Link>
        </div>

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
            {attempts.map((attempt) => {
              const exam = attempt.exams;
              const lecture = exam?.lectures;
              const chapter = lecture?.chapters;

              return (
                <div
                  key={attempt.id}
                  className="rounded-3xl bg-[#081321]/95 border border-cyan-500/20 p-8 flex flex-col lg:flex-row items-center justify-between gap-6"
                >
                  <div className="space-y-3 w-full lg:w-auto">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📚</span>
                      <div>
                        <p className="text-xs text-slate-500">الفصل</p>
                        <h2 className="text-3xl font-black text-white">
                          {chapter?.title ?? "الفصل العام"}
                        </h2>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xl">📖</span>
                      <div>
                        <p className="text-xs text-slate-500">المحاضرة</p>
                        <p className="text-cyan-400 text-lg font-bold">
                          {lecture?.title ?? "المحاضرة العامة"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xl">📝</span>
                      <div>
                        <p className="text-xs text-slate-500">الامتحان</p>
                        <p className="text-xl font-bold text-white">
                          📑 {exam?.title ?? "امتحان"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <span>📅</span>
                      <p className="text-slate-400 text-sm">
                        {new Date(attempt.created_at).toLocaleDateString("ar-EG", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>

                    <div className="pt-2">
                      <span
                        className={`inline-flex items-center rounded-full px-4 py-1 text-sm font-bold ${
                          Number(attempt.percentage) >= 50
                            ? "bg-green-500/20 text-green-400 border border-green-500/40"
                            : "bg-red-500/20 text-red-400 border border-red-500/40"
                        }`}
                      >
                        {Number(attempt.percentage) >= 50 ? "✅ ناجح" : "❌ راسب"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-6 items-center">
                    <div className="text-center">
                      <p className="text-slate-400">الدرجة</p>
                      <h3 className="text-3xl font-black text-cyan-400">
                        {attempt.score}/{attempt.total}
                      </h3>
                    </div>

                    <div className="text-center">
                      <p className="text-slate-400">النسبة</p>
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
                    className="w-full lg:w-auto rounded-2xl bg-cyan-500 hover:bg-cyan-400 transition-all duration-300 px-12 py-5 text-xl font-black shadow-lg hover:shadow-cyan-500/30 text-center"
                  >
                    عرض النتيجة
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}