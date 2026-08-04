"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Student = {
  full_name: string;
  email: string;
  avatar_url?: string;
  average_score: number;
  total_exams: number;
  rank: number;
};

export default function ProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [lecturesWatched, setLecturesWatched] = useState(0);

  useEffect(() => {
    const loadStudent = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("students")
        .select(`
          full_name,
          email,
          avatar_url,
          average_score,
          total_exams,
          rank
        `)
        .eq("auth_id", user.id)
        .single();

      if (data) {
        setStudent(data);
      }

      const { count: lecturesCount } = await supabase
        .from("lecture_progress")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("student_id", user.id)
        .eq("completed", true);

      setLecturesWatched(lecturesCount || 0);

      setLoading(false);
    };

    loadStudent();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        جاري التحميل...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-cyan-500/20 bg-slate-900/80 p-8">
        <h1 className="mb-8 text-center text-4xl font-bold text-cyan-400">
          الملف الشخصي
        </h1>

        <div className="flex flex-col items-center">
          <img
            src={student?.avatar_url || "/images/default-avatar.png"}
            className="w-36 h-36 rounded-full border-4 border-cyan-400 object-cover"
            alt=""
          />
          <h2 className="mt-5 text-3xl font-bold text-white">
            {student?.full_name}
          </h2>
          <p className="text-slate-400">
            {student?.email}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-950 p-6 text-center border border-cyan-500/20">
            <p className="text-slate-400">الامتحانات</p>
            <p className="text-4xl font-black text-cyan-400">
              {student?.total_exams ?? 0}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-6 text-center border border-cyan-500/20">
            <p className="text-slate-400">المتوسط</p>
            <p className="text-4xl font-black text-green-400">
              {student?.average_score ?? 0}%
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-6 text-center border border-cyan-500/20">
            <p className="text-slate-400">الترتيب</p>
            <p className="text-4xl font-black text-yellow-400">
              #{student?.rank ?? "-"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-6 text-center border border-cyan-500/20">
            <p className="text-slate-400">المحاضرات المكتملة</p>
            <p className="text-4xl font-black text-purple-400">
              {lecturesWatched}
            </p>
          </div>
        </div>

        <Link
          href="/profile/results"
          className="mt-10 block rounded-2xl bg-cyan-500 py-4 text-center text-lg font-bold text-white transition hover:bg-cyan-600"
        >
          📋 نتائج الامتحانات
        </Link>
      </div>
    </main>
  );
}