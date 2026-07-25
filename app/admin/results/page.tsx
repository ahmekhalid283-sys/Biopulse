"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Result = {
  id: string;
  score: number;
  total: number;
  percentage: number;
  duration_seconds: number;
  started_at: string;
  finished_at: string;

  students?: {
    full_name: string;
  };

  exams?: {
    title: string;
  };
};

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select(`
        *,
        students(full_name),
        exams(title)
      `)
      .order("finished_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setResults(data || []);
  }


  async function deleteResult(id: string) {
    if (!confirm("حذف هذه النتيجة؟")) return;

    const { error } = await supabase
      .from("exam_attempts")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadResults();
  }

  const filtered = useMemo(() => {
    return results.filter((r) => {
      const student = r.students?.full_name?.toLowerCase() || "";
      const exam = r.exams?.title?.toLowerCase() || "";

      return (
        student.includes(search.toLowerCase()) ||
        exam.includes(search.toLowerCase())
      );
    });
  }, [results, search]);

  const highest =
    results.length > 0
      ? Math.max(...results.map((r) => Number(r.percentage)))
      : 0;

  const studentsCount = new Set(
    results
      .map((r) => r.students?.full_name)
      .filter(Boolean)
  ).size;

  const examsCount = results.length;

  const average =
    results.length === 0
      ? 0
    : Number(
        (
          results.reduce((sum, r) => sum + Number(r.percentage), 0) /
          results.length
        ).toFixed(2)
      );

  return (
    <main className="p-8">

      <h1 className="text-4xl font-bold mb-8">
        نتائج الطلاب
      </h1>


      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

        <div className="rounded-xl border bg-white p-5 shadow">
          <p className="text-gray-500">عدد المحاولات</p>
          <h2 className="text-3xl font-bold">
            {examsCount}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <p className="text-gray-500">عدد الطلاب</p>
          <h2 className="text-3xl font-bold">
            {studentsCount}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <p className="text-gray-500">أعلى نسبة</p>
          <h2 className="text-3xl font-bold text-green-600">
            {highest.toFixed(2)}%
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow">
          <p className="text-gray-500">متوسط النسبة</p>
          <h2 className="text-3xl font-bold text-blue-600">
            {average}%
          </h2>
        </div>

      </div>


      <input
        type="text"
        placeholder="ابحث باسم الطالب أو الامتحان..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-5 w-full rounded-lg border p-3"
      />

      <div className="overflow-x-auto rounded-xl border bg-white">

        <table className="w-full">

          <thead className="bg-slate-800 text-white">

            <tr>
              <th className="p-3">الطالب</th>
              <th className="p-3">الامتحان</th>
              <th className="p-3">الدرجة</th>
              <th className="p-3">النسبة</th>
              <th className="p-3">المدة</th>
              <th className="p-3">وقت الحل</th>
              <th className="p-3">إجراءات</th>
            </tr>

          </thead>

          <tbody>

            {filtered.map((r) => (

              <tr
                key={r.id}
                className="border-b text-center hover:bg-slate-50"
              >

                <td className="p-3">
                  {r.students?.full_name}
                </td>

                <td className="p-3">
                  {r.exams?.title}
                </td>

                <td className="p-3 font-bold">
                  {r.score}/{r.total}
                </td>

                <td className="p-3 text-green-600 font-bold">
                  {Number(r.percentage).toFixed(2)}%
                </td>

                <td className="p-3">
                  {r.duration_seconds >= 60
                    ? `${Math.floor(r.duration_seconds / 60)} دقيقة`
                    : `${r.duration_seconds} ثانية`}
                </td>

                <td className="p-3">
                  {new Date(r.finished_at).toLocaleString("ar-EG")}
                </td>

                <td className="p-3">

                  <button
                    onClick={() => deleteResult(r.id)}
                    className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                  >
                    حذف
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </main>
  );
}