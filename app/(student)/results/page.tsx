"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    if (!student) return;

    const { data } = await supabase
      .from("exam_attempts")
      .select("*")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false });

    setResults(data || []);
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">نتائجي</h1>

      <div className="space-y-4">
        {results.map((r) => (
          <div
            key={r.id}
            className="rounded-xl border p-5 bg-white shadow"
          >
            <p><b>الدرجة:</b> {r.score}/{r.total}</p>
            <p><b>النسبة:</b> {Number(r.percentage).toFixed(2)}%</p>
            <p><b>التاريخ:</b> {new Date(r.created_at).toLocaleString("ar-EG")}</p>
          </div>
        ))}
      </div>
    </main>
  );
}