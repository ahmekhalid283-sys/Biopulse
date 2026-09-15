"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Lightbulb,
  Play,
  Video,
  ClipboardCheck,
} from "lucide-react";

type Lecture = {
  id: string;
  title: string;
  duration: string | null;
  youtube_url: string | null;
  solution_youtube_url: string | null;
  pdf_url: string | null;
  chapter_id: string;
};

export default function LecturePage() {
  const { lectureId } = useParams<{ lectureId: string }>();

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lectureId) return;

    loadLecture(lectureId);
  }, [lectureId]);

  async function loadLecture(id: string) {
    setLoading(true);

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

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <main
        className="min-h-screen bg-[#050914] text-white"
        dir="rtl"
      >
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />

            <p className="text-sm text-slate-500">
              جاري تحميل المحاضرة...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ================= NOT FOUND ================= */

  if (!lecture) {
    return (
      <main
        className="min-h-screen bg-[#050914] text-white"
        dir="rtl"
      >
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
          <div className="w-full max-w-md border border-slate-800 bg-[#09101c] p-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
              <BookOpen className="h-6 w-6 text-red-400" />
            </div>

            <h2 className="text-xl font-bold">
              المحاضرة غير موجودة
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              المحاضرة التي تبحث عنها غير متاحة حالياً.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              العودة للرئيسية
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#050914] text-white"
      dir="rtl"
    >
      {/* ================= BACKGROUND ================= */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-[420px] w-[420px] rounded-full bg-cyan-500/[0.035] blur-3xl" />

        <div className="absolute bottom-0 left-0 h-[350px] w-[350px] rounded-full bg-blue-600/[0.025] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-7 md:px-8 md:py-10">

        {/* ================= TOP BAR ================= */}

        <div className="mb-8 flex items-center justify-between">

          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />

            العودة للرئيسية
          </Link>

          <div className="hidden items-center gap-2 text-xs text-slate-600 sm:flex">
            <BookOpen className="h-3.5 w-3.5" />

            BioPulse
          </div>

        </div>

        {/* ================= LECTURE HEADER ================= */}

        <section className="border border-slate-800 bg-[#09101c]">

          <div className="p-7 md:p-10">

            {/* Badge */}

            <div className="mb-5 flex items-center gap-2">

              <div className="flex h-10 w-10 items-center justify-center border border-cyan-400/20 bg-cyan-400/10">
                <Video className="h-5 w-5 text-cyan-400" />
              </div>

              <div>
                <p className="text-[11px] font-bold tracking-wider text-cyan-400">
                  محاضرة تعليمية
                </p>

                <p className="mt-0.5 text-xs text-slate-600">
                  BioPulse Learning
                </p>
              </div>

            </div>

            {/* Title */}

            <h1 className="max-w-4xl text-3xl font-black leading-tight tracking-tight md:text-4xl lg:text-5xl">
              {lecture.title}
            </h1>

            {/* Description */}

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
              شاهد الشرح، راجع فيديوهات الحل، حمّل ملف المحاضرة،
              ثم اختبر فهمك من خلال الاختبار.
            </p>

            {/* Meta */}

            <div className="mt-7 flex flex-wrap items-center gap-6 border-t border-slate-800/80 pt-6">

              {lecture.duration && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock3 className="h-4 w-4 text-slate-600" />

                  <span>{lecture.duration}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />

                <span>محتوى متاح</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-400">
                <BookOpen className="h-4 w-4 text-slate-600" />

                <span>محاضرة تعليمية</span>
              </div>

            </div>

          </div>

        </section>

        {/* ================= SECTION TITLE ================= */}

        <section className="mb-6 mt-12">

          <p className="mb-2 text-xs font-bold tracking-[0.18em] text-cyan-500">
            CONTENT
          </p>

          <h2 className="text-2xl font-black tracking-tight md:text-3xl">
            محتوى المحاضرة
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            اختر القسم الذي تريد البدء به.
          </p>

        </section>

        {/* ================= CONTENT GRID ================= */}

        <div className="grid gap-4 md:grid-cols-2">

          {/* ================================================= */}
          {/* EXPLANATION */}
          {/* ================================================= */}

          <section className="group flex min-h-[270px] flex-col border border-slate-800 bg-[#09101c] p-6 transition duration-200 hover:border-cyan-500/30">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center border border-cyan-400/20 bg-cyan-400/10">
                <Play className="h-5 w-5 fill-cyan-400 text-cyan-400" />
              </div>

              {lecture.youtube_url && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  متاح
                </span>
              )}

            </div>

            <div className="mt-6 flex-1">

              <h3 className="text-xl font-bold">
                فيديوهات الشرح
              </h3>

              <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                شاهد جميع فيديوهات شرح المحاضرة بالترتيب
                وتابع المحتوى خطوة بخطوة.
              </p>

            </div>

            {lecture.youtube_url ? (
              <Link
                href={`/lectures/${lecture.id}/videos`}
                className="mt-6"
              >
                <Button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 text-sm font-bold text-slate-950 transition hover:bg-cyan-400">
                  <Play className="h-4 w-4 fill-current" />

                  مشاهدة الشرح
                </Button>
              </Link>
            ) : (
              <div className="mt-6 border border-slate-800 py-3 text-center text-xs text-slate-600">
                فيديوهات الشرح غير متوفرة حالياً
              </div>
            )}

          </section>

          {/* ================================================= */}
          {/* SOLUTION */}
          {/* ================================================= */}

          <section className="group flex min-h-[270px] flex-col border border-slate-800 bg-[#09101c] p-6 transition duration-200 hover:border-orange-500/30">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center border border-orange-400/20 bg-orange-400/10">
                <Lightbulb className="h-5 w-5 text-orange-400" />
              </div>

              {lecture.solution_youtube_url && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  متاح
                </span>
              )}

            </div>

            <div className="mt-6 flex-1">

              <h3 className="text-xl font-bold">
                فيديوهات الحل
              </h3>

              <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                راجع طريقة حل الأسئلة من خلال فيديوهات الحل
                المرتبة الخاصة بالمحاضرة.
              </p>

            </div>

            {lecture.solution_youtube_url ? (
              <Link
                href={`/lectures/${lecture.id}/solution-videos`}
                className="mt-6"
              >
                <Button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-orange-500 text-sm font-bold text-slate-950 transition hover:bg-orange-400">
                  <Play className="h-4 w-4 fill-current" />

                  مشاهدة الحل
                </Button>
              </Link>
            ) : (
              <div className="mt-6 border border-slate-800 py-3 text-center text-xs text-slate-600">
                فيديوهات الحل غير متوفرة حالياً
              </div>
            )}

          </section>

          {/* ================================================= */}
          {/* PDF */}
          {/* ================================================= */}

          <section className="group flex min-h-[270px] flex-col border border-slate-800 bg-[#09101c] p-6 transition duration-200 hover:border-purple-500/30">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center border border-purple-400/20 bg-purple-400/10">
                <FileText className="h-5 w-5 text-purple-400" />
              </div>

              {lecture.pdf_url && (
                <span className="text-[11px] font-semibold text-purple-400">
                  PDF
                </span>
              )}

            </div>

            <div className="mt-6 flex-1">

              <h3 className="text-xl font-bold">
                ملف المحاضرة
              </h3>

              <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                حمّل ملف المحاضرة واحتفظ به للمراجعة في أي وقت.
              </p>

            </div>

            {lecture.pdf_url ? (
              <a
                href={lecture.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6"
              >
                <Button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-purple-600 text-sm font-bold text-white transition hover:bg-purple-500">
                  <Download className="h-4 w-4" />

                  تحميل الملف
                </Button>
              </a>
            ) : (
              <div className="mt-6 border border-slate-800 py-3 text-center text-xs text-slate-600">
                ملف المحاضرة غير متوفر حالياً
              </div>
            )}

          </section>

          {/* ================================================= */}
          {/* EXAM */}
          {/* ================================================= */}

          <section className="group flex min-h-[270px] flex-col border border-slate-800 bg-[#09101c] p-6 transition duration-200 hover:border-pink-500/30">

            <div className="flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center border border-pink-400/20 bg-pink-400/10">
                <ClipboardCheck className="h-5 w-5 text-pink-400" />
              </div>

              <span className="text-[11px] font-semibold text-pink-400">
                اختبار
              </span>

            </div>

            <div className="mt-6 flex-1">

              <h3 className="text-xl font-bold">
                اختبار المحاضرة
              </h3>

              <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
                اختبر فهمك للمحاضرة بعد الانتهاء من الشرح
                ومراجعة فيديوهات الحل.
              </p>

            </div>

            <Link
              href={`/lectures/${lecture.id}/exams`}
              className="mt-6"
            >
              <Button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-pink-600 text-sm font-bold text-white transition hover:bg-pink-500">
                <ClipboardCheck className="h-4 w-4" />

                دخول الاختبار
              </Button>
            </Link>

          </section>

        </div>

        {/* ================= BOTTOM NOTE ================= */}

        <div className="mt-10 flex items-center justify-center gap-2 border-t border-slate-800/70 pt-6 text-center text-xs text-slate-600">

          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500/70" />

          <span>
            ابدأ بالشرح ثم راجع الحل قبل دخول الاختبار.
          </span>

        </div>

      </div>
    </main>
  );
}