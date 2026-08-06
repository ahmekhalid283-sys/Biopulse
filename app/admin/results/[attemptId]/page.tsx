"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
      <main className="p-10">
        <h2 className="text-2xl font-bold">جاري التحميل...</h2>
      </main>
    );
  }

  if (!attempt) {
    return (
      <main className="p-10">
        <h2 className="text-2xl font-bold text-red-600">
          لم يتم العثور على النتيجة
        </h2>
      </main>
    );
  }

  const exam = attempt.exams;
  const lecture = exam?.lectures;
  const chapter = lecture?.chapters;

  return (
    <main className="max-w-5xl mx-auto py-10 px-6 space-y-8">

      <Link
        href="/admin/students"
        className="text-cyan-600 font-bold"
      >
        ← رجوع
      </Link>

      <div className="rounded-xl border p-8 bg-white shadow">

        <div className="flex items-center gap-6">

          <img
            src={
              attempt.students?.avatar_url ||
              "/images/default-avatar.png"
            }
            className="w-28 h-28 rounded-full object-cover border"
          />

          <div>
            <h1 className="text-3xl font-black">
              {attempt.students?.full_name}
            </h1>

            <p className="text-slate-500">
              {attempt.students?.email}
            </p>
          </div>

        </div>

      </div>

      <div className="grid md:grid-cols-2 gap-6">

        <div className="rounded-xl border p-6 bg-white">
          <p className="text-slate-500">الفصل</p>
          <h2 className="text-2xl font-bold">
            {chapter?.title}
          </h2>
        </div>

        <div className="rounded-xl border p-6 bg-white">
          <p className="text-slate-500">المحاضرة</p>
          <h2 className="text-2xl font-bold">
            {lecture?.title}
          </h2>
        </div>

        <div className="rounded-xl border p-6 bg-white">
          <p className="text-slate-500">الامتحان</p>
          <h2 className="text-2xl font-bold">
            {exam?.title}
          </h2>
        </div>

        <div className="rounded-xl border p-6 bg-white">
          <p className="text-slate-500">الدرجة</p>
          <h2 className="text-3xl font-black text-cyan-600">
            {attempt.score} / {attempt.total}
          </h2>
        </div>

        <div className="rounded-xl border p-6 bg-white">
          <p className="text-slate-500">النسبة</p>
          <h2 className="text-3xl font-black text-green-600">
            {Math.round(attempt.percentage)}%
          </h2>
        </div>

        <div className="rounded-xl border p-6 bg-white">
          <p className="text-slate-500">مدة الحل</p>
          <h2 className="text-2xl font-bold">
            {Math.floor(attempt.duration_seconds / 60)} دقيقة
          </h2>
        </div>

        <div className="rounded-xl border p-6 bg-white">
          <p className="text-slate-500">بدأ الامتحان</p>
          <h2 className="font-bold">
            {new Date(attempt.started_at).toLocaleString("ar-EG")}
          </h2>
        </div>

        <div className="rounded-xl border p-6 bg-white">
          <p className="text-slate-500">أنهى الامتحان</p>
          <h2 className="font-bold">
            {new Date(attempt.finished_at).toLocaleString("ar-EG")}
          </h2>
        </div>

      </div>

    </main>
  );
}