"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
        .limit(10),
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
    <main className="max-w-7xl mx-auto p-8">

      <h1 className="text-4xl font-bold mb-8">
        لوحة تحكم الأدمن
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">

        <Card title="الطلاب" value={stats.students} />
        <Card title="الفصول" value={stats.chapters} />
        <Card title="المحاضرات" value={stats.lectures} />
        <Card title="الامتحانات" value={stats.exams} />
        <Card title="المحاولات" value={stats.attempts} />

      </div>

      <div className="grid md:grid-cols-2 gap-5 mt-10">

        <QuickLink
          href="/admin/chapters"
          title="📚 إدارة الفصول"
        />

        <QuickLink
          href="/admin/lectures"
          title="🎥 إدارة المحاضرات"
        />

        <QuickLink
          href="/admin/exams"
          title="📝 إدارة الامتحانات"
        />

        <QuickLink
          href="/admin/questions"
          title="❓ إدارة الأسئلة"
        />

      </div>

      <div className="mt-12">

        <h2 className="text-3xl font-bold mb-5">
          آخر نتائج الطلاب
        </h2>

        <div className="rounded-xl border overflow-hidden">

          <table className="w-full">

            <thead className="bg-gray-100">

              <tr>

                <th className="p-3 border">الطالب</th>
                <th className="p-3 border">الامتحان</th>
                <th className="p-3 border">الدرجة</th>
                <th className="p-3 border">النسبة</th>

              </tr>

            </thead>

            <tbody>

              {latestAttempts.map((a) => (

                <tr key={a.id}>

                  <td className="border p-3">
                    {a.students?.full_name}
                  </td>

                  <td className="border p-3">
                    {a.exams?.title}
                  </td>

                  <td className="border p-3">
                    {a.score}/{a.total}
                  </td>

                  <td className="border p-3">
                    {Number(a.percentage).toFixed(2)}%
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

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
    <div className="rounded-xl border bg-white shadow p-6 text-center">
      <h2 className="text-gray-500">{title}</h2>

      <p className="text-5xl font-bold mt-3">
        {value}
      </p>
    </div>
  );
}

function QuickLink({
  href,
  title,
}: {
  href: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border bg-white shadow p-8 text-2xl font-bold hover:bg-blue-50 transition"
    >
      {title}
    </Link>
  );
}