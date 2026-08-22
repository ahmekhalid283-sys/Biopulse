"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Lecture = {
  id: string;
  title: string;
};

export default function AdminExamsPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [lectureId, setLectureId] = useState("");

  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [score, setScore] = useState("");

  const [isFree, setIsFree] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadLectures();
    loadExams();
  }, []);

  async function loadLectures() {
    const { data } = await supabase
      .from("lectures")
      .select("*")
      .order("lecture_order");

    if (data) {
      setLectures(data);

      if (data.length > 0) {
        setLectureId(data[0].id);
      }
    }
  }

  async function loadExams() {
    const { data, error } = await supabase
      .from("exams")
      .select(`
        *,
        lectures(title)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setExams(data);
    }
  }

  async function handleSave() {
    if (!lectureId || !title || !duration || !score) {
      alert("املأ جميع البيانات");
      return;
    }

    setLoading(true);

    let error;

    if (editingId) {
      ({ error } = await supabase
        .from("exams")
        .update({
          lecture_id: lectureId,
          title,
          duration_minutes: Number(duration),
          total_score: Number(score),
          is_free: isFree,
          is_published: isPublished,
          start_at: startAt || null,
          end_at: endAt || null,
        })
        .eq("id", editingId));
    } else {
      ({ error } = await supabase
        .from("exams")
        .insert({
          lecture_id: lectureId,
          title,
          duration_minutes: Number(duration),
          total_score: Number(score),
          questions_count: 0,
          is_free: isFree,
          is_published: isPublished,
          start_at: startAt || null,
          end_at: endAt || null,
        }));
    }

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(editingId ? "تم تعديل الامتحان" : "تم إنشاء الامتحان");

    loadExams();

    setEditingId(null);
    setTitle("");
    setDuration("");
    setScore("");
    setStartAt("");
    setEndAt("");
    setIsFree(false);
    setIsPublished(true);
  }

  function editExam(exam: any) {
    setEditingId(exam.id);

    setTitle(exam.title);
    setDuration(exam.duration_minutes.toString());
    setScore(exam.total_score.toString());

    setLectureId(exam.lecture_id);

    setIsFree(exam.is_free);
    setIsPublished(exam.is_published);

    setStartAt(exam.start_at?.slice(0, 16) || "");
    setEndAt(exam.end_at?.slice(0, 16) || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteExam(id: string) {
    if (!confirm("حذف الامتحان؟")) return;

    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadExams();
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 px-3 py-5 text-slate-100 sm:px-6 sm:py-8"
    >
      <div className="mx-auto max-w-6xl">

        {/* ================================================= */}
        {/* Header */}
        {/* ================================================= */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10">
                <span className="text-xl">📝</span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                إدارة الامتحانات
              </h1>
            </div>

            <p className="text-sm text-slate-400">
              إنشاء وإدارة الامتحانات والتحكم في نشرها ومواعيدها.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur px-5 py-3 shadow-sm">
            <p className="text-xs font-bold text-slate-400">
              إجمالي الامتحانات
            </p>

            <p className="mt-1 text-2xl font-black text-cyan-400">
              {exams.length}
            </p>
          </div>
        </div>

        {/* ================================================= */}
        {/* Create / Edit Exam */}
        {/* ================================================= */}

        <section className="mb-10 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 backdrop-blur shadow-[0_12px_40px_rgba(0,0,0,0.4)]">

          <div className="border-b border-slate-800 bg-slate-900/90 px-5 py-5 text-white sm:px-7">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                {editingId ? "✏️" : "➕"}
              </div>

              <div>
                <h2 className="text-xl font-black text-white">
                  {editingId
                    ? "تعديل الامتحان"
                    : "إنشاء امتحان جديد"}
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  أدخل بيانات الامتحان الأساسية.
                </p>
              </div>
            </div>

          </div>

          <div className="space-y-6 p-5 sm:p-7">

            {/* Lecture */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                المحاضرة
              </label>

              <select
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-sm text-slate-200 outline-none transition focus:border-cyan-500 focus:bg-slate-950 focus:ring-4 focus:ring-cyan-500/10"
                value={lectureId}
                onChange={(e) => setLectureId(e.target.value)}
              >
                {lectures.map((lecture) => (
                  <option key={lecture.id} value={lecture.id} className="bg-slate-950 text-slate-200">
                    {lecture.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Basic Info */}
            <div className="grid gap-5 md:grid-cols-3">

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  اسم الامتحان
                </label>

                <Input
                  placeholder="مثال: امتحان Chapter 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:bg-slate-950 focus-visible:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  المدة بالدقائق
                </label>

                <Input
                  type="number"
                  placeholder="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:bg-slate-950 focus-visible:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  الدرجة النهائية
                </label>

                <Input
                  type="number"
                  placeholder="30"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-slate-200 placeholder:text-slate-600 focus:border-cyan-500 focus:bg-slate-950 focus-visible:ring-cyan-500/20"
                />
              </div>

            </div>

            {/* Dates */}
            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  موعد فتح الامتحان
                </label>

                <Input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-slate-200 focus:border-cyan-500 focus:bg-slate-950 focus-visible:ring-cyan-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  موعد غلق الامتحان
                </label>

                <Input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-slate-200 focus:border-cyan-500 focus:bg-slate-950 focus-visible:ring-cyan-500/20"
                />
              </div>

            </div>

            {/* Settings */}
            <div className="grid gap-3 sm:grid-cols-2">

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-cyan-500/40 hover:bg-slate-900/60">

                <input
                  type="checkbox"
                  checked={isFree}
                  onChange={(e) => setIsFree(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-cyan-500 accent-cyan-500 focus:ring-0"
                />

                <div>
                  <p className="font-bold text-slate-200">
                    امتحان مجاني
                  </p>

                  <p className="text-xs text-slate-400">
                    متاح للطلاب بدون اشتراك مدفوع.
                  </p>
                </div>

              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-cyan-500/40 hover:bg-slate-900/60">

                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-cyan-500 accent-cyan-500 focus:ring-0"
                />

                <div>
                  <p className="font-bold text-slate-200">
                    نشر الامتحان
                  </p>

                  <p className="text-xs text-slate-400">
                    يظهر للطلاب عند تفعيله.
                  </p>
                </div>

              </label>

            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 border-t border-slate-800 pt-5 sm:flex-row">

              <Button
                onClick={handleSave}
                disabled={loading}
                className="h-12 rounded-xl bg-cyan-500 px-7 font-black text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition"
              >
                {loading
                  ? "جارٍ الحفظ..."
                  : editingId
                  ? "حفظ التعديلات"
                  : "إنشاء الامتحان"}
              </Button>

              {editingId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setTitle("");
                    setDuration("");
                    setScore("");
                    setStartAt("");
                    setEndAt("");
                    setIsFree(false);
                    setIsPublished(true);
                  }}
                  className="h-12 rounded-xl border-slate-800 bg-slate-950 text-slate-300 font-bold hover:bg-slate-900 hover:text-white"
                >
                  إلغاء التعديل
                </Button>
              )}

            </div>

          </div>
        </section>

        {/* ================================================= */}
        {/* Exams List */}
        {/* ================================================= */}

        <section>

          <div className="mb-5 flex items-center justify-between">

            <div>
              <h2 className="text-2xl font-black text-white sm:text-3xl">
                الامتحانات الموجودة
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                إدارة الامتحانات الحالية والتحكم في محتواها.
              </p>
            </div>

          </div>

          <div className="space-y-4">

            {exams.length === 0 ? (

              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center shadow-sm">

                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-2xl">
                  📝
                </div>

                <p className="font-bold text-slate-400">
                  لا توجد امتحانات حتى الآن.
                </p>

              </div>

            ) : (

              exams.map((exam) => (

                <div
                  key={exam.id}
                  className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur shadow-sm transition hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-lg"
                >

                  <div className="p-5 sm:p-6">

                    {/* Exam info */}
                    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      <div className="min-w-0">

                        <div className="mb-2 flex flex-wrap items-center gap-2">

                          <h3 className="text-xl font-black text-white">
                            {exam.title}
                          </h3>

                          {exam.is_published ? (

                            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-black text-emerald-400">
                              ● منشور
                            </span>

                          ) : (

                            <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-[11px] font-black text-rose-400">
                              ● مخفي
                            </span>

                          )}

                          {exam.is_free && (
                            <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-[11px] font-black text-cyan-400">
                              مجاني
                            </span>
                          )}

                        </div>

                        <p className="text-sm font-medium text-slate-400">
                          📚 {exam.lectures?.title || "بدون محاضرة"}
                        </p>

                      </div>

                      <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-white">

                        <p className="text-[10px] font-bold text-cyan-300">
                          الدرجة
                        </p>

                        <p className="mt-0.5 text-xl font-black text-cyan-400">
                          {exam.total_score}
                        </p>

                      </div>

                    </div>

                    {/* Stats */}
                    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <p className="text-[10px] font-bold text-slate-500">
                          المدة
                        </p>
                        <p className="mt-1 font-black text-slate-200">
                          ⏱ {exam.duration_minutes} دقيقة
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <p className="text-[10px] font-bold text-slate-500">
                          الأسئلة
                        </p>
                        <p className="mt-1 font-black text-slate-200">
                          ❓ {exam.questions_count || 0}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <p className="text-[10px] font-bold text-slate-500">
                          الفتح
                        </p>
                        <p className="mt-1 truncate text-xs font-bold text-slate-300">
                          {exam.start_at
                            ? new Date(exam.start_at).toLocaleString("ar-EG")
                            : "غير محدد"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                        <p className="text-[10px] font-bold text-slate-500">
                          الغلق
                        </p>
                        <p className="mt-1 truncate text-xs font-bold text-slate-300">
                          {exam.end_at
                            ? new Date(exam.end_at).toLocaleString("ar-EG")
                            : "غير محدد"}
                        </p>
                      </div>

                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-800 pt-4 sm:flex sm:flex-wrap">

                      <Button
                        variant="outline"
                        onClick={() => editExam(exam)}
                        className="rounded-xl border-slate-800 bg-slate-950 text-slate-300 font-bold hover:bg-slate-900 hover:text-white"
                      >
                        ✏️ تعديل
                      </Button>

                      <Button
                        onClick={async () => {
                          await supabase
                            .from("exams")
                            .update({
                              is_published:
                                !exam.is_published,
                            })
                            .eq("id", exam.id);

                          loadExams();
                        }}
                        className="rounded-xl border border-slate-700 bg-slate-800 font-bold text-slate-200 hover:bg-slate-700 hover:text-white"
                      >
                        {exam.is_published
                          ? "🙈 إخفاء"
                          : "👁 نشر"}
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={() => deleteExam(exam.id)}
                        className="rounded-xl font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                      >
                        🗑 حذف
                      </Button>

                      <Link
                        href={`/admin/questions/${exam.id}`}
                        className="w-full sm:w-auto"
                      >
                        <Button className="w-full rounded-xl bg-cyan-500 font-bold text-slate-950 hover:bg-cyan-400">
                          ❓ إدارة الأسئلة
                        </Button>
                      </Link>

                    </div>

                  </div>

                </div>

              ))

            )}

          </div>

        </section>

      </div>
    </main>
  );
}