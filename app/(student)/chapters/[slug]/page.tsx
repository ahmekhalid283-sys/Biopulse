"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
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
  pdf_url: string | null;
  is_free: boolean;
};

export default function ChapterPage() {
  const { slug } = useParams<{ slug: string }>();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) loadData();
  }, [slug]);

  async function loadData() {
    const { data: chapterData } = await supabase
      .from("chapters")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!chapterData) {
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
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <h2 className="text-3xl font-bold animate-pulse">
          جاري تحميل المحاضرات...
        </h2>
      </main>
    );
  }

  if (!chapter) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">
        الفصل غير موجود
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/background.jpg"
          className="w-full h-full object-cover opacity-10"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/80 to-slate-950" />
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-r from-cyan-900 via-slate-900 to-slate-950 border border-cyan-500/20 p-10"
        >
          <h1 className="text-5xl font-black text-cyan-400">
            {chapter.title}
          </h1>

          <p className="mt-4 text-slate-300 text-lg">
            جميع المحاضرات الخاصة بالفصل
          </p>

          <div className="mt-8 h-3 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-cyan-400 w-0" />
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {lectures.map((lecture, index) => (
            <motion.div
              key={lecture.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.08,
              }}
              whileHover={{
                y: -8,
                scale: 1.02,
              }}
              className="
              rounded-3xl
              border
              border-cyan-500/20
              bg-[#081321]/90
              backdrop-blur-xl
              overflow-hidden
              transition
              duration-500
              hover:shadow-[0_0_35px_rgba(34,211,238,.18)]
              "
            >
              <div className="h-44 overflow-hidden">
                <img
                  src={`/images/chapters/${slug}.png`}
                  className="w-full h-full object-cover transition duration-500 hover:scale-110"
                  alt=""
                  onError={(e) => {
                    e.currentTarget.src =
                      "/images/chapters/default.png";
                  }}
                />
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    🎥 {lecture.title}
                  </h2>

                  <span className="rounded-full bg-cyan-500/20 px-4 py-1 text-cyan-300">
                    #{lecture.lecture_order}
                  </span>
                </div>

                <div className="mt-5 flex gap-6 text-slate-300">
                  <span>
                    ⏱ {lecture.duration || "-"}
                  </span>

                  <span
                    className={
                      lecture.is_free
                        ? "text-green-400"
                        : "text-orange-400"
                    }
                  >
                    {lecture.is_free
                      ? "🆓 مجانية"
                      : "🔒 مدفوعة"}
                  </span>
                </div>

                <div className="mt-6 h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div className="bg-cyan-400 h-full w-0" />
                </div>

                <div className="mt-6">
                  <Link href={`/lectures/${lecture.id}`}>
                    <Button className="w-full h-12 text-lg bg-cyan-500 hover:bg-cyan-600 font-bold rounded-xl text-white">
                      🚀 ابدأ المحاضرة
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}