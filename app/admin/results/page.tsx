"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Result = {
  id: string;
  score: number;
  total: number;
  percentage: number;
  duration_seconds: number;
  started_at: string;
  finished_at: string;

  students: {
    full_name: string;
  };

  exams: {
    title: string;
  };
};

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);

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

  return (
    <main className="p-8">

      <h1 className="text-4xl font-bold mb-8">
        نتائج الطلاب
      </h1>

      <div className="overflow-x-auto">

        <table className="w-full border">

          <thead className="bg-slate-800 text-white">

            <tr>
              <th className="p-3">الطالب</th>
              <th className="p-3">الامتحان</th>
              <th className="p-3">الدرجة</th>
              <th className="p-3">النسبة</th>
              <th className="p-3">المدة</th>
              <th className="p-3">وقت الحل</th>
            </tr>

          </thead>

          <tbody>

            {results.map((r) => (

              <tr key={r.id} className="border-b text-center">

                <td className="p-3">
                  {r.students?.full_name}
                </td>

                <td className="p-3">
                  {r.exams?.title}
                </td>

                <td className="p-3">
                  {r.score} / {r.total}
                </td>

                <td className="p-3">
                  {r.percentage.toFixed(2)}%
                </td>

                <td className="p-3">
                  {Math.floor(r.duration_seconds / 60)} دقيقة
                </td>

                <td className="p-3">
                  {new Date(r.finished_at).toLocaleString("ar-EG")}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </main>
  );
}