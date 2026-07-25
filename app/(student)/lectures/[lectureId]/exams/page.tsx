"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
      <main className="max-w-5xl mx-auto p-10">
        <h2 className="text-2xl font-bold">
          جاري تحميل الامتحانات...
        </h2>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-10">

      <h1 className="text-4xl font-bold mb-2">
        📝 امتحانات المحاضرة
      </h1>

      <p className="text-gray-500 mb-8">
        اختر الامتحان الذي تريد البدء فيه.
      </p>

      {exams.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-gray-500">
          لا توجد امتحانات متاحة حالياً.
        </div>
      ) : (
        <div className="grid gap-6">

          {exams.map((exam) => (
            <div
              key={exam.id}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-2xl font-bold">
                    {exam.title}
                  </h2>

                  <div className="mt-3 space-y-1 text-gray-600">

                    <p>
                      ⏱ المدة: {exam.duration_minutes} دقيقة
                    </p>

                    <p>
                      🎯 الدرجة النهائية: {exam.total_score}
                    </p>

                    <p>
                      {exam.is_free ? "🟢 مجاني" : "🔒 مدفوع"}
                    </p>

                  </div>

                </div>

                <Link href={`/exam/${exam.id}`}>
                  <button className="rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700">
                    🚀 بدء الامتحان
                  </button>
                </Link>

              </div>
            </div>
          ))}

        </div>
      )}
    </main>
  );
}