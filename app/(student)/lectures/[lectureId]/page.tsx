"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";

type Lecture = {
  id: string;
  title: string;
  duration: string | null;

  // فيديو الشرح
  youtube_url: string | null;

  // فيديو الحل
  solution_youtube_url: string | null;

  pdf_url: string | null;
  chapter_id: string;
};

const CHAPTER_IMAGES: Record<string, string> = {
  "support-movement": "/images/chapters/support.png",
  hormones: "/images/chapters/hormones.png",
  reproduction: "/images/chapters/reproduction.png",
  immunity: "/images/chapters/immunity.png",
  "molecular-biology": "/images/chapters/dna.png",
};

const DEFAULT_CHAPTER_IMAGE = "/images/chapters/default.png";

export default function LecturePage() {
  const { lectureId } = useParams<{ lectureId: string }>();

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [chapterSlug, setChapterSlug] = useState<string | null>(null);
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

      // جلب الفصل الخاص بالمحاضرة
      const { data: chapterData, error: chapterError } = await supabase
        .from("chapters")
        .select("slug")
        .eq("id", data.chapter_id)
        .single();

      if (!chapterError && chapterData) {
        setChapterSlug(chapterData.slug);
      }
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <h2 className="text-2xl font-bold">
          جاري تحميل المحاضرة...
        </h2>
      </main>
    );
  }

  if (!lecture) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <h2 className="text-2xl font-bold text-red-500">
          المحاضرة غير موجودة
        </h2>
      </main>
    );
  }

  const lectureImage =
    CHAPTER_IMAGES[chapterSlug ?? ""] ?? DEFAULT_CHAPTER_IMAGE;

  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/background.jpg"
          className="w-full h-full object-cover opacity-10"
          alt=""
        />

        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/80 to-slate-950" />
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12">

        {/* HEADER / BACK BUTTON */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-400 transition hover:bg-cyan-500/20"
          >
            ← العودة للرئيسية
          </Link>

          <div className="w-24" />
        </div>

        {/* Hero */}
        <div className="rounded-3xl overflow-hidden border border-cyan-500/20 bg-[#081321]/90 backdrop-blur-xl">

          <img
            src={lectureImage}
            className="w-full h-72 object-cover"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_CHAPTER_IMAGE;
            }}
            alt={lecture.title}
          />

          <div className="p-8">

            <span className="inline-block rounded-full bg-cyan-500/20 px-4 py-2 text-cyan-300 text-sm font-bold">
              {lecture.duration || "مدة غير محددة"}
            </span>

            <h1 className="mt-5 text-5xl font-black">
              {lecture.title}
            </h1>

            <p className="mt-4 text-slate-400 text-lg">
              شاهد المحاضرة ثم شاهد فيديو الحل وقم بحل الامتحان للحصول على النقاط.
            </p>

          </div>
        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-4 gap-8 mt-10">

          {/* ================= VIDEO EXPLANATION ================= */}
          <div className="rounded-3xl border border-cyan-500/20 bg-[#081321]/90 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(34,211,238,.25)]">

            <div className="text-6xl mb-5">
              🎥
            </div>

            <h2 className="text-2xl font-bold">
              فيديو الشرح
            </h2>

            <p className="mt-3 text-slate-400">
              شاهد شرح المحاضرة بالتفصيل.
            </p>

            {lecture.youtube_url ? (
              <a
                href={lecture.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="mt-8 w-full h-14 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-lg font-bold">
                  ▶ مشاهدة الشرح
                </Button>
              </a>
            ) : (
              <div className="mt-8 text-center text-slate-500">
                فيديو الشرح غير متوفر
              </div>
            )}

          </div>

          {/* ================= SOLUTION VIDEO ================= */}
          <div className="rounded-3xl border border-orange-500/20 bg-[#081321]/90 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(249,115,22,.25)]">

            <div className="text-6xl mb-5">
              🧠
            </div>

            <h2 className="text-2xl font-bold">
              فيديو الحل
            </h2>

            <p className="mt-3 text-slate-400">
              شاهد حل وأسئلة المحاضرة وراجع إجاباتك.
            </p>

            {lecture.solution_youtube_url ? (
              <a
                href={lecture.solution_youtube_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="mt-8 w-full h-14 rounded-xl bg-orange-500 hover:bg-orange-600 text-lg font-bold">
                  ▶ مشاهدة الحل
                </Button>
              </a>
            ) : (
              <div className="mt-8 text-center text-slate-500">
                فيديو الحل غير متوفر
              </div>
            )}

          </div>

          {/* ================= PDF ================= */}
          <div className="rounded-3xl border border-purple-500/20 bg-[#081321]/90 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(168,85,247,.25)]">

            <div className="text-6xl mb-5">
              📄
            </div>

            <h2 className="text-2xl font-bold">
              ملف المحاضرة
            </h2>

            <p className="mt-3 text-slate-400">
              حمل ملف المحاضرة من هنا.
            </p>

            {lecture.pdf_url ? (
              <a
                href={lecture.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="mt-8 w-full h-14 rounded-xl bg-purple-600 hover:bg-purple-700 text-lg font-bold">
                  تحميل PDF
                </Button>
              </a>
            ) : (
              <div className="mt-8 text-center text-slate-500">
                لا يوجد PDF
              </div>
            )}

          </div>

          {/* ================= EXAM ================= */}
          <div className="rounded-3xl border border-pink-500/20 bg-[#081321]/90 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(236,72,153,.25)]">

            <div className="text-6xl mb-5">
              📝
            </div>

            <h2 className="text-2xl font-bold">
              اختبار المحاضرة
            </h2>

            <p className="mt-3 text-slate-400">
              بعد الانتهاء من المشاهدة اختبر نفسك.
            </p>

            <Link href={`/lectures/${lecture.id}/exams`}>
              <Button className="mt-8 w-full h-14 rounded-xl bg-pink-600 hover:bg-pink-700 text-lg font-bold">
                🚀 ابدأ الامتحان
              </Button>
            </Link>

          </div>

        </div>

      </div>
    </main>
  );
}