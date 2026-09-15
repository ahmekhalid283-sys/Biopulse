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

  // فيديو الشرح القديم (للتوافق)
  const [youtube, setYoutube] = useState("");

  // قائمة فيديوهات الشرح المتعددة
  const [lectureVideos, setLectureVideos] = useState<
    { title: string; youtube_url: string }[]
  >([{ title: "فيديو الشرح 1", youtube_url: "" }]);

  // قائمة فيديوهات الحل المتعددة الجديدة
  const [solutionVideos, setSolutionVideos] = useState<
    { title: string; youtube_url: string }[]
  >([{ title: "فيديو الحل 1", youtube_url: "" }]);

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

  async function editLecture(lecture: any) {
    setEditingId(lecture.id);

    setChapterId(lecture.chapter_id);
    setTitle(lecture.title);

    // فيديو الشرح
    setYoutube(lecture.youtube_url || "");
    setLectureOrder(String(lecture.lecture_order));

    setPdfFile(null);

    // جلب الفيديوهات المتعددة الخاصة بالمحاضرة (الشرح)
    const { data: videoData } = await supabase
      .from("lecture_videos")
      .select("title, youtube_url")
      .eq("lecture_id", lecture.id)
      .order("video_order", { ascending: true });

    if (videoData && videoData.length > 0) {
      setLectureVideos(videoData);
    } else {
      setLectureVideos([
        {
          title: "فيديو الشرح 1",
          youtube_url: lecture.youtube_url || "",
        },
      ]);
    }

    // جلب فيديوهات الحل المتعددة
    const { data: solutionVideoData } = await supabase
      .from("lecture_solution_videos")
      .select("title, youtube_url")
      .eq("lecture_id", lecture.id)
      .order("video_order", { ascending: true });

    if (solutionVideoData && solutionVideoData.length > 0) {
      setSolutionVideos(solutionVideoData);
    } else {
      setSolutionVideos([
        {
          title: "فيديو الحل 1",
          youtube_url: lecture.solution_youtube_url || "",
        },
      ]);
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setYoutube("");
    setLectureOrder("");
    setPdfFile(null);
    setLectureVideos([
      { title: "فيديو الشرح 1", youtube_url: "" },
    ]);
    setSolutionVideos([
      { title: "فيديو الحل 1", youtube_url: "" },
    ]);
  }

  async function handleSave() {
    const validVideos = lectureVideos.filter(
      (video) => video.youtube_url.trim()
    );

    const validSolutionVideos = solutionVideos.filter(
      (video) => video.youtube_url.trim()
    );

    if (
      !chapterId ||
      !title ||
      validVideos.length === 0 ||
      !lectureOrder
    ) {
      alert("املأ جميع البيانات الأساسية وفيديو شرح واحد على الأقل");
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

    let targetLectureId = editingId;

    if (editingId) {
      const updateData: any = {
        chapter_id: chapterId,
        title,
        lecture_order: Number(lectureOrder),
        youtube_url: validVideos[0].youtube_url,
        solution_youtube_url:
          validSolutionVideos[0]?.youtube_url.trim() || null,
      };

      if (pdfUrl) {
        updateData.pdf_url = pdfUrl;
      }

      const { error } = await supabase
        .from("lectures")
        .update(updateData)
        .eq("id", editingId);

      if (error) {
        setLoading(false);
        alert(error.message);
        return;
      }
    } else {
      const { data: insertedLecture, error } = await supabase
        .from("lectures")
        .insert({
          chapter_id: chapterId,
          title,
          lecture_order: Number(lectureOrder),
          youtube_url: validVideos[0].youtube_url,
          solution_youtube_url:
            validSolutionVideos[0]?.youtube_url.trim() || null,
          pdf_url: pdfUrl,
          is_workshop: false,
          is_free: false,
          is_published: true,
        })
        .select("id")
        .single();

      if (error) {
        setLoading(false);
        alert(error.message);
        return;
      }

      targetLectureId = insertedLecture.id;
    }

    if (targetLectureId) {
      // حفظ / تحديث فيديوهات الشرح
      await supabase
        .from("lecture_videos")
        .delete()
        .eq("lecture_id", targetLectureId);

      const videosToInsert = validVideos.map((video, index) => ({
        lecture_id: targetLectureId,
        title: video.title.trim() || `فيديو الشرح ${index + 1}`,
        youtube_url: video.youtube_url.trim(),
        video_order: index + 1,
      }));

      const { error: videosError } = await supabase
        .from("lecture_videos")
        .insert(videosToInsert);

      if (videosError) {
        setLoading(false);
        alert(videosError.message);
        return;
      }

      // حفظ / تحديث فيديوهات الحل
      await supabase
        .from("lecture_solution_videos")
        .delete()
        .eq("lecture_id", targetLectureId);

      if (validSolutionVideos.length > 0) {
        const solutionVideosToInsert = validSolutionVideos.map(
          (video, index) => ({
            lecture_id: targetLectureId,
            title:
              video.title.trim() || `فيديو الحل ${index + 1}`,
            youtube_url: video.youtube_url.trim(),
            video_order: index + 1,
          })
        );

        const { error: solutionVideosError } = await supabase
          .from("lecture_solution_videos")
          .insert(solutionVideosToInsert);

        if (solutionVideosError) {
          setLoading(false);
          alert(solutionVideosError.message);
          return;
        }
      }
    }

    setLoading(false);
    alert(editingId ? "تم تعديل المحاضرة بنجاح ✅" : "تمت إضافة المحاضرة بنجاح ✅");

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
                type="button"
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

              {/* Lecture Videos List */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-cyan-400" />
                    فيديوهات الشرح
                  </label>

                  <Button
                    type="button"
                    onClick={() =>
                      setLectureVideos((prev) => [
                        ...prev,
                        {
                          title: `فيديو الشرح ${prev.length + 1}`,
                          youtube_url: "",
                        },
                      ])
                    }
                    className="h-9 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-sm flex flex-row items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    إضافة فيديو
                  </Button>
                </div>

                <div className="space-y-3">
                  {lectureVideos.map((video, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-800 bg-[#070b14] p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-black text-cyan-400">
                          فيديو الشرح {index + 1}
                        </span>

                        {lectureVideos.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setLectureVideos((prev) =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          placeholder={`عنوان فيديو الشرح ${index + 1}`}
                          value={video.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLectureVideos((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, title: val }
                                  : item
                              )
                            );
                          }}
                          className="h-12 rounded-2xl border-slate-800 bg-[#0b111e] text-white"
                        />

                        <Input
                          placeholder="https://youtube.com/..."
                          value={video.youtube_url}
                          onChange={(e) => {
                            const val = e.target.value;
                            setLectureVideos((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, youtube_url: val }
                                  : item
                              )
                            );
                          }}
                          className="h-12 rounded-2xl border-slate-800 bg-[#0b111e] text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Solution Videos List */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-orange-400" />
                    فيديوهات الحل (اختياري)
                  </label>

                  <Button
                    type="button"
                    onClick={() =>
                      setSolutionVideos((prev) => [
                        ...prev,
                        {
                          title: `فيديو الحل ${prev.length + 1}`,
                          youtube_url: "",
                        },
                      ])
                    }
                    className="h-9 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-sm flex flex-row items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    إضافة فيديو
                  </Button>
                </div>

                <div className="space-y-3">
                  {solutionVideos.map((video, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-800 bg-[#070b14] p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-black text-orange-400">
                          فيديو الحل {index + 1}
                        </span>

                        {solutionVideos.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setSolutionVideos((prev) =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          placeholder={`عنوان فيديو الحل ${index + 1}`}
                          value={video.title}
                          onChange={(e) => {
                            const val = e.target.value;

                            setSolutionVideos((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, title: val }
                                  : item
                              )
                            );
                          }}
                          className="h-12 rounded-2xl border-slate-800 bg-[#0b111e] text-white"
                        />

                        <Input
                          placeholder="https://youtube.com/..."
                          value={video.youtube_url}
                          onChange={(e) => {
                            const val = e.target.value;

                            setSolutionVideos((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? { ...item, youtube_url: val }
                                  : item
                              )
                            );
                          }}
                          className="h-12 rounded-2xl border-slate-800 bg-[#0b111e] text-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
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
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="flex-1 h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 transition"
              >
                {loading ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة المحاضرة"}
              </Button>
              {editingId && (
                <Button
                  type="button"
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
                      type="button"
                      variant="outline"
                      onClick={() => editLecture(lecture)}
                      className="h-11 px-4 rounded-2xl font-bold border-slate-800 bg-[#070b14] text-slate-300 hover:bg-slate-800 hover:text-white"
                    >
                      <Pencil className="w-4 h-4 ml-1.5 text-slate-400" />
                      تعديل
                    </Button>
                    <Button
                      type="button"
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