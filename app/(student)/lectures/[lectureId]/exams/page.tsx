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
      .eq("is_published", true);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setExams(data || []);
  }

  if (loading) {
    return <div className="p-8">جارٍ تحميل الامتحانات...</div>;
  }

  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">
        امتحانات المحاضرة
      </h1>

      {exams.length === 0 ? (
        <div>لا توجد امتحانات.</div>
      ) : (
        <div className="space-y-5">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="rounded-xl border bg-white p-6 flex justify-between items-center"
            >
              <div>
                <h2 className="text-2xl font-bold">
                  {exam.title}
                </h2>

                <p>{exam.duration_minutes} دقيقة</p>
              </div>

              <Link href={`/exam/${exam.id}`}>
                <button className="rounded bg-green-600 px-6 py-3 text-white">
                  بدء الامتحان
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}