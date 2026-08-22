"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Mail,
} from "lucide-react";

export default function AdminResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();

  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttempt();
  }, []);

  async function loadAttempt() {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select(`
        *,
        students(
          full_name,
          email,
          avatar_url
        ),
        exams(
          title,
          lectures(
            title,
            chapters(
              title
            )
          )
        )
      `)
      .eq("id", attemptId)
      .single();

    if (!error) {
      setAttempt(data);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#07090e] p-6 text-slate-100"
      >
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-slate-800 bg-[#0d1322] p-10 shadow-xl">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-800" />
            <div className="mt-6 h-4 w-72 animate-pulse rounded bg-slate-800/60" />
          </div>
        </div>
      </main>
    );
  }

  if (!attempt) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#07090e] p-6 text-slate-100"
      >
        <div className="mx-auto max-w-6xl">
          <div className="rounded-3xl border border-red-500/20 bg-[#0d1322] p-10 text-center shadow-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
              <FileText className="h-7 w-7" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-red-400">
              لم يتم العثور على النتيجة
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              قد تكون النتيجة غير موجودة أو تم حذفها.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const exam = attempt.exams;
  const lecture = exam?.lectures;
  const chapter = lecture?.chapters;

  const percentage = Math.round(attempt.percentage);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#07090e] p-4 text-slate-100 sm:p-6 lg:p-10"
    >
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-950">
                <Award className="h-7 w-7" />
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                  نتيجة الطالب
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  تفاصيل محاولة الامتحان والنتيجة النهائية.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/admin/students"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#0d1322] px-5 py-3 text-sm font-black text-slate-300 shadow-xl transition hover:border-blue-500/30 hover:bg-slate-800/50 hover:text-blue-400"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للطلاب
          </Link>
        </div>

        {/* Student Hero */}
        <section className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d1322] to-[#0b101d] border border-slate-800 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute -left-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-2xl" />
          <div className="absolute -bottom-24 right-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <img
              src={
                attempt.students?.avatar_url ||
                "/images/default-avatar.png"
              }
              alt={attempt.students?.full_name || "Student"}
              className="h-24 w-24 rounded-3xl border-4 border-slate-800 object-cover shadow-lg sm:h-28 sm:w-28"
            />

            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2 text-cyan-400">
                <GraduationCap className="h-5 w-5" />
                <span className="text-sm font-bold">
                  طالب BioPulse
                </span>
              </div>

              <h2 className="text-2xl font-black text-white sm:text-3xl">
                {attempt.students?.full_name}
              </h2>

              <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                <Mail className="h-4 w-4" />
                {attempt.students?.email}
              </div>
            </div>
          </div>
        </section>

        {/* Result Summary */}
        <section className="mb-7 grid gap-4 sm:grid-cols-3">
          {/* Score */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d1322] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400">الدرجة</p>
                <p className="mt-2 text-3xl font-black text-white">
                  {attempt.score}
                  <span className="mx-1 text-lg text-slate-600">/</span>
                  {attempt.total}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Percentage */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d1322] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400">النسبة</p>
                <p className="mt-2 text-3xl font-black text-emerald-400">
                  {percentage}%
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div className="rounded-2xl border border-slate-800 bg-[#0d1322] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400">مدة الحل</p>
                <p className="mt-2 text-2xl font-black text-purple-400">
                  {Math.floor(attempt.duration_seconds / 60)} دقيقة
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <Clock3 className="h-6 w-6" />
              </div>
            </div>
          </div>
        </section>

        {/* Exam Information */}
        <section className="mb-7 rounded-3xl border border-slate-800 bg-[#0d1322] p-6 shadow-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">بيانات الامتحان</h2>
              <p className="text-xs text-slate-400">معلومات المحتوى المرتبط بالمحاولة</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <InfoCard label="الفصل" value={chapter?.title} />
            <InfoCard label="المحاضرة" value={lecture?.title} />
            <InfoCard label="الامتحان" value={exam?.title} />
          </div>
        </section>

        {/* Timeline */}
        <section className="rounded-3xl border border-slate-800 bg-[#0d1322] p-6 shadow-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <CalendarCheck className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">تفاصيل المحاولة</h2>
              <p className="text-xs text-slate-400">وقت بدء وإنهاء الامتحان</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DateCard label="بدأ الامتحان" value={attempt.started_at} />
            <DateCard label="أنهى الامتحان" value={attempt.finished_at} />
          </div>
        </section>

      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#07090e] p-5">
      <p className="mb-2 text-xs font-bold text-slate-400">{label}</p>
      <p className="text-lg font-black text-slate-200">
        {value || "غير متوفر"}
      </p>
    </div>
  );
}

function DateCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#07090e] p-5">
      <p className="mb-2 text-xs font-bold text-slate-400">{label}</p>
      <p className="text-sm font-black leading-6 text-slate-300">
        {value ? new Date(value).toLocaleString("ar-EG") : "غير متوفر"}
      </p>
    </div>
  );
}