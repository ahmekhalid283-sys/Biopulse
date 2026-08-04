"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function ResultsContent() {
  const { attemptId } = useParams<{ attemptId: string }>();
  
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attemptId) {
      fetchAttemptDetails();
    }
  }, [attemptId]);

  async function fetchAttemptDetails() {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select(`
        score,
        total,
        percentage,
        duration_seconds,
        created_at,
        exams(
          title
        )
      `)
      .eq("id", attemptId)
      .single();

    if (error) {
      console.error("Error fetching attempt details:", error.message);
    } else if (data) {
      setScore(data.score);
      setTotal(data.total);
      setPercentage(Number(data.percentage));
      setAttempt(data);
    }
    setLoading(false);
  }

  console.log("Results AttemptId:", attemptId);

  const passed = percentage >= 50;

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

      <div className="relative max-w-4xl mx-auto py-16 px-6">
        <div className="rounded-[35px] border border-cyan-500/20 bg-[#081321]/95 backdrop-blur-xl p-10 text-center">
          
          <div
            className={`mx-auto mb-8 flex h-36 w-36 items-center justify-center rounded-full border-8 ${
              passed
                ? "border-green-500 bg-green-500/10"
                : "border-red-500 bg-red-500/10"
            }`}
          >
            <span
              className={`text-5xl font-black ${
                passed ? "text-green-400" : "text-red-400"
              }`}
            >
              {percentage}%
            </span>
          </div>

          <h1 className="text-5xl font-black">
            {passed ? "أحسنت 👏" : "حاول مرة أخرى 💪"}
          </h1>

          <p className="mt-3 text-slate-400">
            {passed
              ? "لقد اجتزت الامتحان بنجاح"
              : "لم تحصل على درجة النجاح"}
          </p>

          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="rounded-2xl bg-slate-900 p-6">
              <p className="text-slate-400">الدرجة</p>
              <h2 className="text-4xl mt-3 font-black text-cyan-400">
                {score}
              </h2>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6">
              <p className="text-slate-400">الدرجة الكلية</p>
              <h2 className="text-4xl mt-3 font-black text-yellow-400">
                {total}
              </h2>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6">
              <p className="text-slate-400">الحالة</p>
              <h2
                className={`text-3xl mt-3 font-black ${
                  passed ? "text-green-400" : "text-red-400"
                }`}
              >
                {passed ? "ناجح" : "راسب"}
              </h2>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6">
              <p className="text-slate-400">اسم الامتحان</p>
              <h2 className="text-2xl mt-3 font-bold text-white">
                {attempt?.exams?.title}
              </h2>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6">
              <p className="text-slate-400">مدة الحل</p>
              <h2 className="text-2xl mt-3 font-bold text-cyan-400">
                {Math.floor((attempt?.duration_seconds || 0) / 60)} دقيقة
              </h2>
            </div>

            <div className="rounded-2xl bg-slate-900 p-6">
              <p className="text-slate-400">تاريخ الامتحان</p>
              <h2 className="text-lg mt-3 font-bold text-yellow-400">
                {attempt?.created_at &&
                  new Date(attempt.created_at).toLocaleDateString("ar-EG")}
              </h2>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {attemptId && (
              <Link
                href={`/review/${attemptId}`}
                className="rounded-2xl bg-cyan-600 py-5 text-xl font-black hover:bg-cyan-500 transition-all flex items-center justify-center"
              >
                مراجعة الامتحان
              </Link>
            )}

            <Link
              href="/dashboard"
              className="rounded-xl bg-blue-600 py-4 font-bold hover:bg-blue-500 flex items-center justify-center"
            >
              لوحة الطالب
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          جاري التحميل...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}