"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FileQuestion,
  Plus,
  BookOpen,
  ChevronLeft,
  Search,
  Sparkles,
  Layers3,
} from "lucide-react";

type Exam = {
  id: string;
  title: string;
};

export default function QuestionsPage() {
  const router = useRouter();

  const [exams, setExams] = useState<Exam[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadExams();
  }, []);

  async function loadExams() {
    const { data } = await supabase
      .from("exams")
      .select("id,title")
      .order("created_at", { ascending: false });

    if (data) setExams(data);
  }

  const filteredExams = exams.filter((exam) =>
    exam.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#070b14] p-4 text-slate-100 sm:p-6 lg:p-10"
    >
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-[#0b111e] text-blue-400 shadow-lg">
                <FileQuestion className="h-7 w-7" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                    إدارة الأسئلة
                  </h1>
                  <Sparkles className="h-5 w-5 text-cyan-400" />
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  اختر الامتحان لإدارة أسئلته وإضافة أسئلة جديدة بكفاءة وسهولة.
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن امتحان معين..."
              className="w-full rounded-2xl border border-slate-800 bg-[#0b111e] py-3.5 pr-11 pl-4 text-sm font-semibold text-white outline-none transition placeholder:font-normal placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-3xl border border-slate-800 bg-[#0b111e] p-6 shadow-sm transition hover:border-slate-700">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400">
                إجمالي الامتحانات المسجلة
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {exams.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-slate-800 bg-[#0b111e] p-6 shadow-sm transition hover:border-slate-700">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
              <Layers3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400">
                الامتحانات المعروضة حالياً
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {filteredExams.length}
              </p>
            </div>
          </div>
        </div>

        {/* Exams List Container */}
        {filteredExams.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-[#0b111e] p-16 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-[#070b14] text-slate-500">
              <FileQuestion className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-black text-slate-200">
              لا توجد امتحانات متاحة
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              لم يتم العثور على أي امتحان مطابق لكلمة البحث الخاصة بك.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredExams.map((exam, index) => (
              <div
                key={exam.id}
                className="group rounded-3xl border border-slate-800 bg-[#0b111e] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-700 sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  
                  {/* Exam Info */}
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-[#070b14] text-base font-black text-blue-400 shadow-inner">
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <span className="inline-block rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[11px] font-black text-blue-400">
                        قائمة الامتحانات
                      </span>
                      <h2 className="mt-1.5 truncate text-lg font-black text-white sm:text-xl">
                        {exam.title}
                      </h2>
                      <p className="text-xs text-slate-400">
                        اضغط على زر الإضافة للبدء في كتابة وإدارة الأسئلة الخاصة بهذا الامتحان.
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() =>
                      router.push(`/admin/questions/${exam.id}`)
                    }
                    className="h-12 rounded-2xl bg-[#2563eb] px-6 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#1d4ed8] sm:w-auto"
                  >
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة أسئلة
                    <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1.5" />
                  </Button>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}