"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    chapters: 0,
    lectures: 0,
    exams: 0,
    attempts: 0,
  });

  const [latestAttempts, setLatestAttempts] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const [
      students,
      chapters,
      lectures,
      exams,
      attempts,
      latest,
    ] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("chapters").select("*", { count: "exact", head: true }),
      supabase.from("lectures").select("*", { count: "exact", head: true }),
      supabase.from("exams").select("*", { count: "exact", head: true }),
      supabase.from("exam_attempts").select("*", { count: "exact", head: true }),

      supabase
        .from("exam_attempts")
        .select(`
          *,
          students(full_name),
          exams(title)
        `)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    setStats({
      students: students.count || 0,
      chapters: chapters.count || 0,
      lectures: lectures.count || 0,
      exams: exams.count || 0,
      attempts: attempts.count || 0,
    });

    setLatestAttempts(latest.data || []);
  }

  return (
    <main className="space-y-8">

      <h1 className="text-4xl font-bold">
        Dashboard الإدارة
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

        <Card title="👨‍🎓 الطلاب" value={stats.students} />
        <Card title="📚 الفصول" value={stats.chapters} />
        <Card title="🎥 المحاضرات" value={stats.lectures} />
        <Card title="📝 الامتحانات" value={stats.exams} />
        <Card title="🏆 المحاولات" value={stats.attempts} />

      </div>

      <div className="rounded-xl border bg-white p-6 shadow">

        <h2 className="text-2xl font-bold mb-6">
          آخر نتائج الطلاب
        </h2>

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="text-right p-3">الطالب</th>
              <th className="text-right p-3">الامتحان</th>
              <th className="text-right p-3">الدرجة</th>
              <th className="text-right p-3">النسبة</th>

            </tr>

          </thead>

          <tbody>

            {latestAttempts.map((a) => (

              <tr key={a.id} className="border-b">

                <td className="p-3">
                  {a.students?.full_name}
                </td>

                <td className="p-3">
                  {a.exams?.title}
                </td>

                <td className="p-3">
                  {a.score}/{a.total}
                </td>

                <td className="p-3 text-green-600">
                  {Number(a.percentage).toFixed(2)}%
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </main>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-white border shadow p-6">

      <p className="text-gray-500">
        {title}
      </p>

      <h2 className="text-4xl font-bold mt-3">
        {value}
      </h2>

    </div>
  );
}