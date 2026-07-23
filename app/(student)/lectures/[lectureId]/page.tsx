"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Lecture = {
  id: string;
  title: string;
  duration: string | null;
  youtube_url: string | null;
  pdf_url: string | null;
};

export default function LecturePage() {
  const { lectureId } = useParams<{ lectureId: string }>();

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLecture();
  }, []);

  async function loadLecture() {
    const id = lectureId;

    const { data, error } = await supabase
      .from("lectures")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setLecture(data);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="p-8">
        <h2 className="text-2xl font-bold">
          جاري تحميل المحاضرة...
        </h2>
      </main>
    );
  }

  if (!lecture) {
    return (
      <main className="p-8">
        <h2 className="text-2xl font-bold text-red-600">
          المحاضرة غير موجودة
        </h2>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">

      <h1 className="text-4xl font-bold text-blue-600">
        {lecture.title}
      </h1>

      <p className="text-gray-500 mt-2 mb-8">
        مدة المحاضرة: {lecture.duration || "-"}
      </p>

      <Card>
        <CardContent className="p-6 space-y-5">

          <div className="rounded-xl border bg-white p-8 text-center">

            <h2 className="text-2xl font-bold mb-3">
              🎥 مشاهدة المحاضرة
            </h2>

            <p className="text-gray-500 mb-6">
              اضغط على الزر لفتح المحاضرة على YouTube.
            </p>

            {lecture.youtube_url && (
              <a
                href={lecture.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full">
                  ▶️ مشاهدة المحاضرة
                </Button>
              </a>
            )}

          </div>

          {lecture.pdf_url && (
            <a
              href={lecture.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full">
                📄 تحميل PDF
              </Button>
            </a>
          )}

          <Link href={`/lectures/${lecture.id}/exams`}>
            <Button className="w-full">
              📝 دخول الامتحان
            </Button>
          </Link>

        </CardContent>
      </Card>

    </main>
  );
}