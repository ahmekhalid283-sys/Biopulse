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

        {/* Hero */}
        <div className="rounded-3xl overflow-hidden border border-cyan-500/20 bg-[#081321]/90 backdrop-blur-xl">

          <img
            src="/images/lecture-banner.jpg"
            className="w-full h-72 object-cover"
            onError={(e)=>{
              e.currentTarget.src="/images/background.jpg";
            }}
            alt=""
          />

          <div className="p-8">

            <span className="inline-block rounded-full bg-cyan-500/20 px-4 py-2 text-cyan-300 text-sm font-bold">
              {lecture.duration || "مدة غير محددة"}
            </span>

            <h1 className="mt-5 text-5xl font-black">
              {lecture.title}
            </h1>

            <p className="mt-4 text-slate-400 text-lg">
              شاهد المحاضرة ثم قم بحل الامتحان للحصول على النقاط.
            </p>

          </div>

        </div>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mt-10">

          {/* Video */}
          <div className="rounded-3xl border border-cyan-500/20 bg-[#081321]/90 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(34,211,238,.25)]">

            <div className="text-6xl mb-5">
              🎥
            </div>

            <h2 className="text-2xl font-bold">
              مشاهدة المحاضرة
            </h2>

            <p className="mt-3 text-slate-400">
              ابدأ مشاهدة الفيديو الآن.
            </p>

            {lecture.youtube_url && (
              <a
                href={lecture.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="mt-8 w-full h-14 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-lg font-bold">
                  ▶ تشغيل الفيديو
                </Button>
              </a>
            )}

          </div>

          {/* PDF */}
          <div className="rounded-3xl border border-purple-500/20 bg-[#081321]/90 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_35px_rgba(168,85,247,.25)]">

            <div className="text-6xl mb-5">
              📄
            </div>

            <h2 className="text-2xl font-bold">
              ملف المحاضرة
            </h2>

            <p className="mt-3 text-slate-400">
              حمل الملف من هنا.
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

          {/* Exam */}
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