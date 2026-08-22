"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  BookOpen,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Layers3,
  Clock3,
  PlayCircle,
  Lightbulb,
} from "lucide-react";

type Chapter = {
  id: string;
  title: string;
};

export default function AdminLecturesPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterId, setChapterId] = useState("");

  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");

  // فيديو الشرح
  const [youtube, setYoutube] = useState("");

  // فيديو الحل
  const [solutionYoutube, setSolutionYoutube] = useState("");

  const [lectureOrder, setLectureOrder] = useState("");

  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [lectures, setLectures] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadChapters();
    loadLectures();
  }, []);

  async function loadChapters() {
    const { data, error } = await supabase
      .from("chapters")
      .select("id,title")
      .order("display_order");

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setChapters(data);

      if (data.length > 0 && !chapterId) {
        setChapterId(data[0].id);
      }
    }
  }

  async function loadLectures() {
    const { data, error } = await supabase
      .from("lectures")
      .select(`
        *,
        chapters(title)
      `)
      .order("lecture_order");

    if (error) {
      alert(error.message);
      return;
    }

    setLectures(data || []);
  }

  async function deleteLecture(id: string) {
    const ok = confirm("هل تريد حذف المحاضرة؟");

    if (!ok) return;

    const { data, error } = await supabase
      .from("lectures")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      alert(error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert("لم يتم حذف أي محاضرة");
      return;
    }

    alert("تم حذف المحاضرة");
    loadLectures();
  }

  function editLecture(lecture: any) {
    setEditingId(lecture.id);

    setChapterId(lecture.chapter_id);
    setTitle(lecture.title);
    setDuration(lecture.duration || "");

    // فيديو الشرح
    setYoutube(lecture.youtube_url || "");

    // فيديو الحل
    setSolutionYoutube(lecture.solution_youtube_url || "");

    setLectureOrder(String(lecture.lecture_order));

    setPdfFile(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDuration("");
    setYoutube("");
    setSolutionYoutube("");
    setLectureOrder("");
    setPdfFile(null);
  }

  async function handleSave() {
    if (
      !chapterId ||
      !title ||
      !youtube ||
      !lectureOrder
    ) {
      alert("املأ جميع البيانات الأساسية");
      return;
    }

    if (!editingId && !pdfFile) {
      alert("اختر ملف PDF");
      return;
    }

    setLoading(true);

    let pdfUrl: string | null = null;

    if (pdfFile) {
      const extension = pdfFile.name.split(".").pop();
      const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const filePath = `lectures/${fileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from("pdfs")
          .upload(filePath, pdfFile);

      if (uploadError) {
        setLoading(false);
        alert(uploadError.message);
        return;
      }

      const { data: urlData } =
        supabase.storage
          .from("pdfs")
          .getPublicUrl(filePath);

      pdfUrl = urlData.publicUrl;
    }

    if (editingId) {
      const updateData: any = {
        chapter_id: chapterId,
        title,
        lecture_order: Number(lectureOrder),
        duration,
        youtube_url: youtube,
        solution_youtube_url: solutionYoutube.trim() || null,
      };

      if (pdfUrl) {
        updateData.pdf_url = pdfUrl;
      }

      const { error } = await supabase
        .from("lectures")
        .update(updateData)
        .eq("id", editingId);

      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      alert("تم تعديل المحاضرة بنجاح ✅");
    } else {
      const { error } = await supabase
        .from("lectures")
        .insert({
          chapter_id: chapterId,
          title,
          lecture_order: Number(lectureOrder),
          duration,
          youtube_url: youtube,
          solution_youtube_url: solutionYoutube.trim() || null,
          pdf_url: pdfUrl,
          is_workshop: false,
          is_free: false,
          is_published: true,
        });

      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

      alert("تمت إضافة المحاضرة بنجاح ✅");
    }

    resetForm();
    loadLectures();
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b14] p-4 text-slate-100 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-slate-800 bg-[#0b111e] p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0b111e] border border-slate-800 text-[#3b82f6] shadow-lg">
              <BookOpen className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">إدارة المحاضرات</h1>
              <p className="mt-0.5 text-sm font-medium text-slate-400">إضافة وترتيب وتعديل محاضرات الفصول التعليمية</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-xs font-black text-blue-400">
            <Layers3 className="w-4 h-4" />
            <span>إجمالي المحاضرات: {lectures.length}</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#0b111e] shadow-sm">
          <div className="border-b border-slate-800/80 bg-[#0b111e] px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                {editingId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <h2 className="text-lg font-bold text-white">
                {editingId ? "تعديل المحاضرة الحالية" : "إضافة محاضرة جديدة"}
              </h2>
            </div>
            {editingId && (
              <button
                onClick={resetForm}
                className="rounded-xl border border-slate-800 bg-[#070b14] px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                إلغاء التعديل
              </button>
            )}
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Chapter Selection */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Layers3 className="w-4 h-4 text-blue-400" />
                  الفصل الدراسي
                </label>
                <select
                  value={chapterId}
                  onChange={(e) => setChapterId(e.target.value)}
                  className="w-full h-12 rounded-2xl border border-slate-800 bg-[#070b14] px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                >
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id} className="bg-[#0b111e]">
                      {chapter.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  عنوان المحاضرة
                </label>
                <Input
                  placeholder="مثال: مقدمة في تفاضل الدوال المثلثية"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-12 rounded-2xl border-slate-800 bg-[#070b14] px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Order */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Layers3 className="w-4 h-4 text-blue-400" />
                  ترتيب المحاضرة
                </label>
                <Input
                  type="number"
                  placeholder="مثال: 1"
                  value={lectureOrder}
                  onChange={(e) => setLectureOrder(e.target.value)}
                  className="h-12 rounded-2xl border-slate-800 bg-[#070b14] px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Clock3 className="w-4 h-4 text-blue-400" />
                  مدة المحاضرة
                </label>
                <Input
                  placeholder="مثال: 45 دقيقة"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="h-12 rounded-2xl border-slate-800 bg-[#070b14] px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* YouTube URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-cyan-400" />
                  رابط فيديو الشرح (يوتيوب)
                </label>
                <Input
                  placeholder="https://youtube.com/..."
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  className="h-12 rounded-2xl border-slate-800 bg-[#070b14] px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* Solution YouTube URL */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-orange-400" />
                  رابط فيديو الحل (اختياري)
                </label>
                <Input
                  placeholder="https://youtube.com/..."
                  value={solutionYoutube}
                  onChange={(e) => setSolutionYoutube(e.target.value)}
                  className="h-12 rounded-2xl border-slate-800 bg-[#070b14] px-4 text-sm font-semibold text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {/* PDF File Upload */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-400" />
                  ملف الملزمة / PDF
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl p-6 bg-[#070b14] hover:bg-slate-900/50 hover:border-slate-700 cursor-pointer transition">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-slate-200">
                    {pdfFile ? pdfFile.name : editingId ? "اختر ملف PDF جديد لتحديث الملف الحالي" : "اضغط هنا لاختيار ملف PDF"}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">الملفات المدعومة: PDF فقط</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setPdfFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 transition"
              >
                {loading ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة المحاضرة"}
              </Button>
              {editingId && (
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="h-12 px-6 rounded-2xl font-bold border-slate-800 bg-[#070b14] text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  إلغاء
                </Button>
              )}
            </div>

          </div>
        </div>

        {/* Lectures List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white tracking-tight">قائمة المحاضرات المضافة</h2>
          </div>

          {lectures.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-[#0b111e] p-12 text-center shadow-sm">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-bold">لا توجد محاضرات مضافة حتى الآن</p>
              <p className="text-sm text-slate-500 mt-1">قم بإضافة محاضرتك الأولى باستخدام النموذج بالأعلى</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {lectures.map((lecture, index) => (
                <div
                  key={lecture.id}
                  className="rounded-3xl border border-slate-800 bg-[#0b111e] p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition hover:border-slate-700"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-black flex items-center justify-center shrink-0">
                      #{lecture.lecture_order ?? index + 1}
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-base font-black text-white">{lecture.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-800 text-slate-300 px-3 py-1 rounded-xl border border-slate-700/50">
                          <Layers3 className="w-3.5 h-3.5 text-blue-400" />
                          {lecture.chapters?.title || "بدون فصل"}
                        </span>
                        {lecture.duration && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-800 text-slate-300 px-3 py-1 rounded-xl border border-slate-700/50">
                            <Clock3 className="w-3.5 h-3.5 text-blue-400" />
                            {lecture.duration}
                          </span>
                        )}
                        {lecture.pdf_url && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-500/10 text-red-400 px-3 py-1 rounded-xl border border-red-500/20">
                            <FileText className="w-3.5 h-3.5" />
                            PDF
                          </span>
                        )}
                        {lecture.youtube_url && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-xl border border-cyan-500/20">
                            <PlayCircle className="w-3.5 h-3.5" />
                            شرح
                          </span>
                        )}
                        {lecture.solution_youtube_url && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-orange-500/10 text-orange-400 px-3 py-1 rounded-xl border border-orange-500/20">
                            <Lightbulb className="w-3.5 h-3.5" />
                            حل
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <Button
                      variant="outline"
                      onClick={() => editLecture(lecture)}
                      className="h-11 px-4 rounded-2xl font-bold border-slate-800 bg-[#070b14] text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <Pencil className="w-4 h-4 ml-1.5 text-slate-400" />
                      تعديل
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => deleteLecture(lecture.id)}
                      className="h-11 px-4 rounded-2xl font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4 ml-1.5" />
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}