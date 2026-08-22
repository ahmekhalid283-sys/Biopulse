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
  slug: string;
};

type Lecture = {
  id: string;
  title: string;
  duration: string | null;
  lecture_order: number;
  pdf_url: string | null;
  is_free: boolean;
};

/*
|--------------------------------------------------------------------------
| Chapter Images
|--------------------------------------------------------------------------
| كل محاضرات الفصل تستخدم نفس صورة الفصل.
|
| الاستثناءات:
| - الدعامة والحركة
| - الأحياء الجزيئية
|--------------------------------------------------------------------------
*/

const CHAPTER_IMAGES: Record<string, string> = {
  "support-movement": "/images/chapters/support.png",

  // غيّر الـ slug لو اسم الفصل عندك مختلف في Supabase
  "molecular-biology": "/images/chapters/dna.png",

  "hormones": "/images/chapters/hormones.png",
  "reproduction": "/images/chapters/reproduction.png",
  "immunity": "/images/chapters/immunity.png",
};

const DEFAULT_CHAPTER_IMAGE = "/images/chapters/default.png";

export default function ChapterPage() {
  const { slug } = useParams<{ slug: string }>();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      loadData();
    }
  }, [slug]);

  async function loadData() {
    setLoading(true);

    const { data: chapterData, error: chapterError } = await supabase
      .from("chapters")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (chapterError) {
      console.error("Chapter error:", chapterError);
      setLoading(false);
      return;
    }

    if (!chapterData) {
      setLoading(false);
      return;
    }

    setChapter(chapterData);

    const { data: lecturesData, error: lecturesError } = await supabase
      .from("lectures")
      .select("*")
      .eq("chapter_id", chapterData.id)
      .eq("is_published", true)
      .order("lecture_order");

    if (lecturesError) {
      console.error("Lectures error:", lecturesError);
    }

    setLectures(lecturesData || []);
    setLoading(false);
  }

  /*
  |--------------------------------------------------------------------------
  | الصورة الخاصة بالفصل
  |--------------------------------------------------------------------------
  */

  const chapterImage =
    CHAPTER_IMAGES[slug] ?? DEFAULT_CHAPTER_IMAGE;

  if (loading) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 flex items-center justify-center text-white"
      >
        <h2 className="text-3xl font-bold animate-pulse">
          جاري تحميل المحاضرات...
        </h2>
      </main>
    );
  }

  if (!chapter) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400"
      >
        الفصل غير موجود
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="relative min-h-screen bg-slate-950 text-white overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/background.jpg"
          className="w-full h-full object-cover opacity-10"
          alt=""
        />

        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/80 to-slate-950" />
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-10">

        {/* =========================================================
            Chapter Header
        ========================================================= */}

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

        {/* =========================================================
            Lectures
        ========================================================= */}

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

              {/* =====================================================
                  Lecture Image
                  كل محاضرات الفصل تستخدم نفس الصورة
              ===================================================== */}

              <div className="h-44 overflow-hidden">

                <img
                  src={chapterImage}
                  className="
                    w-full
                    h-full
                    object-cover
                    transition
                    duration-500
                    hover:scale-110
                  "
                  alt={chapter.title}
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_CHAPTER_IMAGE;
                  }}
                />

              </div>

              {/* =====================================================
                  Lecture Content
              ===================================================== */}

              <div className="p-6">

                <div className="flex items-center justify-between gap-4">

                  <h2 className="text-2xl font-bold">
                    🎥 {lecture.title}
                  </h2>

                  <span className="shrink-0 rounded-full bg-cyan-500/20 px-4 py-1 text-cyan-300">
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
                    <Button
                      className="
                        w-full
                        h-12
                        text-lg
                        bg-cyan-500
                        hover:bg-cyan-600
                        font-bold
                        rounded-xl
                        text-white
                      "
                    >
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