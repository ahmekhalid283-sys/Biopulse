"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { motion } from "framer-motion";
import { Award, Clock, CheckCircle, XCircle, BarChart2 } from "lucide-react";

type AttemptDetails = {
  score: number;
  total: number;
  percentage: number;
  duration_seconds: number;
  created_at: string;
  exam_id: string;
  exams: {
    title: string;
  }[];
};

export default function ResultsContent() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [attempt, setAttempt] = useState<AttemptDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (attemptId) {
      loadAttemptDetails();
    }
  }, [attemptId]);

  async function loadAttemptDetails() {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select(`
        score,
        total,
        percentage,
        duration_seconds,
        created_at,
        exam_id,
        exams(
          title
        )
      `)
      .eq("id", attemptId)
      .single();

    if (error) {
      alert(error.message);
    } else {
      setAttempt(data);
    }
    setLoading(false);
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} دقيقة و ${secs} ثانية`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <h2 className="text-3xl font-bold animate-pulse">جارٍ تحميل النتيجة...</h2>
      </main>
    );
  }

  if (!attempt) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <h2 className="text-3xl font-bold text-red-500">لم يتم العثور على تفاصيل النتيجة</h2>
      </main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-slate-950 text-white relative overflow-hidden p-6 lg:p-12"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-[#081321]/90 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-8 text-center space-y-4">
          <Award className="w-20 h-20 text-yellow-400 mx-auto animate-bounce" />
          <h1 className="text-4xl font-black">نتيجة الاختبار</h1>
          <p className="text-cyan-400 text-xl font-bold">
            {attempt?.exams?.[0]?.title || "BioPulse Exam"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#081321]/90 border border-cyan-500/20 rounded-2xl p-6 text-center space-y-2">
            <BarChart2 className="w-8 h-8 text-cyan-400 mx-auto" />
            <p className="text-slate-400">الدرجة النهائية</p>
            <p className="text-3xl font-black text-cyan-300">
              {attempt.score} / {attempt.total}
            </p>
          </div>

          <div className="bg-[#081321]/90 border border-cyan-500/20 rounded-2xl p-6 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto" />
            <p className="text-slate-400">النسبة المئوية</p>
            <p className="text-3xl font-black text-green-300">
              {Number(attempt.percentage).toFixed(1)}%
            </p>
          </div>

          <div className="bg-[#081321]/90 border border-cyan-500/20 rounded-2xl p-6 text-center space-y-2">
            <Clock className="w-8 h-8 text-orange-400 mx-auto" />
            <p className="text-slate-400">الوقت المستغرق</p>
            <p className="text-xl font-black text-orange-300">
              {formatDuration(attempt.duration_seconds)}
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {/* إعادة الامتحان */}
          {attempt?.exam_id && (
            <Link
              href={`/exam/${attempt.exam_id}`}
              className="group flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 py-5 text-xl font-black text-white shadow-[0_0_30px_rgba(6,182,212,0.25)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_45px_rgba(6,182,212,0.4)]"
            >
              <span className="text-2xl transition-transform duration-300 group-hover:rotate-180">
                ↻
              </span>
              إعادة الامتحان
            </Link>
          )}

          {/* مراجعة الامتحان */}
          {attemptId && (
            <Link
              href={`/review/${attemptId}`}
              className="flex items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 py-5 text-xl font-black text-cyan-300 transition-all duration-300 hover:-translate-y-1 hover:bg-cyan-500/20"
            >
              مراجعة الامتحان
            </Link>
          )}

          {/*الصفحة الرئيسية */}
          <Link
            href="/dashboard"
            className="flex items-center justify-center rounded-2xl bg-blue-600 py-5 text-xl font-bold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-blue-500"
          >
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </motion.main>
  );
}