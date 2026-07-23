"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminDashboard() {
  const [attempts, setAttempts] = useState<any[]>([]);

  useEffect(() => {
    loadAttempts();
  }, []);

  async function loadAttempts() {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select(`
        *,
        students(full_name,phone),
        exams(title)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      return;
    }

    setAttempts(data || []);
  }

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-8">
        نتائج الطلاب
      </h1>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">الطالب</th>
            <th className="border p-2">الموبايل</th>
            <th className="border p-2">الامتحان</th>
            <th className="border p-2">الدرجة</th>
            <th className="border p-2">النسبة</th>
            <th className="border p-2">التاريخ</th>
          </tr>
        </thead>

        <tbody>
          {attempts.map((a) => (
            <tr key={a.id}>
              <td className="border p-2">{a.students?.full_name}</td>
              <td className="border p-2">{a.students?.phone}</td>
              <td className="border p-2">{a.exams?.title}</td>
              <td className="border p-2">
                {a.score}/{a.total}
              </td>
              <td className="border p-2">
                {Number(a.percentage).toFixed(2)}%
              </td>
              <td className="border p-2">
                {new Date(a.created_at).toLocaleString("ar-EG")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}