"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Chapter = {
  id: string;
  title: string;
};

type Lecture = {
  id: string;
  title: string;
  duration: string | null;
  lecture_order: number;
  youtube_url: string | null;
  pdf_url: string | null;
  is_free: boolean;
  is_published: boolean;
};

export default function ChapterPage() {
  const params = useParams();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const slug = params.slug as string;

    const { data: chapterData, error: chapterError } = await supabase
      .from("chapters")
      .select("*")
      .eq("slug", slug)
      .single();

    if (chapterError || !chapterData) {
      setLoading(false);
      return;
    }

    setChapter(chapterData);

    const { data: lecturesData } = await supabase
      .from("lectures")
      .select("*")
      .eq("chapter_id", chapterData.id)
      .eq("is_published", true)
      .order("lecture_order");

    setLectures(lecturesData || []);

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="p-8">
        <h2 className="text-2xl font-bold">
          جاري تحميل المحاضرات...
        </h2>
      </main>
    );
  }

  if (!chapter) {
    return (
      <main className="p-8">
        <h2 className="text-2xl font-bold text-red-600">
          الفصل غير موجود
        </h2>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">

      <h1 className="text-4xl font-bold text-blue-600 mb-2">
        {chapter.title}
      </h1>

      <p className="text-gray-500 mb-8">
        جميع المحاضرات الخاصة بالفصل
      </p>

      <div className="space-y-6">

        {lectures.map((lecture) => (

          <Card key={lecture.id}>

            <CardHeader>
              <CardTitle>
                {lecture.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">

              <p>
                ⏱ {lecture.duration || "-"}
              </p>

              <p>
                الحالة :
                {" "}
                <span className="font-bold text-green-600">
                  منشورة
                </span>
              </p>

              <div className="flex gap-3 flex-wrap">

                <Link href={`/lectures/${lecture.id}`}>
                  <Button>
                    🎥 مشاهدة
                  </Button>
                </Link>

                {lecture.pdf_url && (
                  <a
                    href={lecture.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button>
                      📄 PDF
                    </Button>
                  </a>
                )}

                <Button>
                  📝 الامتحان
                </Button>

              </div>

            </CardContent>

          </Card>

        ))}

        {lectures.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              لا توجد محاضرات لهذا الفصل.
            </CardContent>
          </Card>
        )}

      </div>

    </main>
  );
}