"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Timer, Trophy, Sparkles, FileText, ArrowRight } from "lucide-react";

type Exam = {
  id: string;
  title: string;
  duration_minutes: number;
  total_score: number;
  is_free: boolean;
};

export default function LectureExamsPage() {
  const { lectureId } = useParams<{ lectureId: string }>();

  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lectureId) {
      loadExams();
    }
  }, [lectureId]);

  async function loadExams() {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("lecture_id", lectureId)
      .eq("is_published", true)
      .order("created_at");

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setExams(data || []);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-400 text-xl font-medium animate-pulse">
          <Sparkles className="w-6 h-6 animate-spin" />
          جاري تحميل الامتحانات...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3 text-white">
            <FileText className="w-9 h-9 text-cyan-400 p-1.5 bg-cyan-950/50 rounded-xl border border-cyan-500/30" />
            امتحانات المحاضرة
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            اختر الامتحان الذي تريد البدء فيه وابدأ اختبار مستواك.
          </p>
        </div>

        {exams.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-40 text-slate-400" />
            <p className="text-lg font-medium">لا توجد امتحانات متاحة حالياً.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition-all duration-300 p-6 shadow-xl backdrop-blur-sm group"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">

                  <div className="space-y-3">
                    <h2 className="text-xl md:text-2xl font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {exam.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                      <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
                        <Timer className="w-4 h-4 text-cyan-400" />
                        <span>المدة: {exam.duration_minutes} دقيقة</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
                        <Trophy className="w-4 h-4 text-amber-400" />
                        <span>الدرجة النهائية: {exam.total_score}</span>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold">
                        {exam.is_free ? (
                          <span className="text-emerald-400 bg-emerald-950/60 border-emerald-500/30 px-2.5 py-0.5 rounded-full border">
                            🟢 مجاني
                          </span>
                        ) : (
                          <span className="text-amber-400 bg-amber-950/60 border-amber-500/30 px-2.5 py-0.5 rounded-full border">
                            🔒 مدفوع
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link href={`/exam/${exam.id}`} className="w-full md:w-auto">
                    <button className="w-full md:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-3.5 text-white font-bold hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-950/50 transition-all duration-300 border border-cyan-400/30 active:scale-95">
                      <span>🚀 بدء الامتحان</span>
                    </button>
                  </Link>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}