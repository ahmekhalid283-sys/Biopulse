"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabase";
import ChapterCard from "@/components/student/ChapterCard";

type Chapter = {
  id: string;
  title: string;
  slug: string;
  teacher: string;
  lectures_count: number;
};

const images = [
  "/images/chapters/support.png",
  "/images/chapters/hormones.png",
  "/images/chapters/reproduction.png",
  "/images/chapters/immunity.png",
  "/images/chapters/dna.png",
];

const colors = [
  "border-cyan-500",
  "border-purple-500",
  "border-pink-500",
  "border-green-500",
  "border-blue-500",
];

export default function ChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChapters();
  }, []);

  async function loadChapters() {
    const { data, error } = await supabase
      .from("chapters")
      .select(`
        id,
        title,
        slug,
        teacher
      `)
      .order("display_order");

    if (!error && data) {
      const chaptersWithCount = await Promise.all(
        data.map(async (chapter) => {
          const { count } = await supabase
            .from("lectures")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("chapter_id", chapter.id)
            .eq("is_published", true);

          return {
            ...chapter,
            lectures_count: count ?? 0,
          };
        })
      );

      setChapters(chaptersWithCount);
      console.log(chaptersWithCount);
    }

    setLoading(false);
  }
  console.log("chapters =", chapters);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <h2 className="text-2xl font-bold">
          جاري تحميل الفصول...
        </h2>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden p-8 lg:p-12">
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/background.jpg"
          className="w-full h-full object-cover opacity-10"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/80 to-slate-950" />
      </div>

      <div className="mb-12">
        <h1 className="text-5xl font-black">
          الفصول الدراسية
        </h1>

        <p className="text-slate-400 mt-4 text-lg">
          اختر الفصل الذي تريد البدء فيه.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {chapters.map((chapter, index) => (
          <ChapterCard
            key={chapter.id}
            title={chapter.title}
            teacher={chapter.teacher}
            lectures={chapter.lectures_count}
            image={images[index] ?? `/images/chapters/${chapter.slug}.png`}
            color={colors[index % colors.length]}
            href={`/chapters/${chapter.slug}`}
          />
        ))}

        {chapters.length === 0 && (
          <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
            لا توجد فصول حتى الآن.
          </div>
        )}
      </div>
    </main>
  );
}