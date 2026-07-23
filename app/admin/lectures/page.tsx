"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Chapter = {
  id: string;
  title: string;
};

export default function AdminLecturesPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterId, setChapterId] = useState("");

  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [youtube, setYoutube] = useState("");
  const [lectureOrder, setLectureOrder] = useState("");

  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [lectures, setLectures] = useState<any[]>([]);
  useEffect(() => {
    loadChapters();
    loadLectures();
  }, []);

  async function loadChapters() {
    const { data } = await supabase
      .from("chapters")
      .select("id,title")
      .order("display_order");

    if (data) {
      setChapters(data);

      if (data.length > 0) {
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

    const { error } = await supabase
      .from("lectures")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("تم حذف المحاضرة");

    loadLectures();
  }
  const [editingId, setEditingId] = useState<string | null>(null);
  
  function editLecture(lecture: any) {
    setEditingId(lecture.id);

    setChapterId(lecture.chapter_id);
    setTitle(lecture.title);
    setDuration(lecture.duration);
    setYoutube(lecture.youtube_url);
    setLectureOrder(String(lecture.lecture_order));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
  
  
  
  async function handleSave() {
    if (
      !chapterId ||
      !title ||
      !youtube ||
      !lectureOrder ||
      !pdfFile
    ) {
      alert("املأ جميع البيانات");
      return;
    }

    setLoading(true);

    const extension = pdfFile.name.split(".").pop();

    const fileName =
      `${Date.now()}-${crypto.randomUUID()}.${extension}`;

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

    const pdfUrl = urlData.publicUrl;

    if (editingId) {
      const { error } = await supabase
        .from("lectures")
        .update({
          chapter_id: chapterId,
          title,
          lecture_order: Number(lectureOrder),
          duration,
          youtube_url: youtube,
          pdf_url: pdfUrl,
        })
        .eq("id", editingId);

      setLoading(false);

      if (error) {
        alert(error.message);
        return;
      }

    } else {

      const { error } = await supabase
        .from("lectures")
        .insert({
          chapter_id: chapterId,
          title,
          lecture_order: Number(lectureOrder),
          duration,
          youtube_url: youtube,
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

    }

    alert("تمت إضافة المحاضرة بنجاح ✅");
    setEditingId(null);
    loadLectures();
    loadLectures();
    setTitle("");
    setDuration("");
    setYoutube("");
    setLectureOrder("");
    setPdfFile(null);
    }
    return (
      <main className="max-w-3xl">

        <h1 className="text-4xl font-bold mb-8">
          إدارة المحاضرات
        </h1>

        <div className="space-y-5">

          <div>
            <label className="block mb-2 font-semibold">
              الفصل
            </label>

            <select
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              className="w-full rounded-md border p-3"
            >
              {chapters.map((chapter) => (
                <option
                  key={chapter.id}
                  value={chapter.id}
                >
                  {chapter.title}
                </option>
              ))}
            </select>
          </div>

          <Input
            placeholder="اسم المحاضرة"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            type="number"
            placeholder="ترتيب المحاضرة"
            value={lectureOrder}
            onChange={(e) => setLectureOrder(e.target.value)}
          />

          <Input
            placeholder="مدة المحاضرة"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />

          <Input
            placeholder="رابط YouTube"
            value={youtube}
            onChange={(e) => setYoutube(e.target.value)}
          />

          <div className="space-y-2">
            <label className="font-semibold">
              ملف PDF
            </label>

            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                if (e.target.files?.length) {
                  setPdfFile(e.target.files[0]);
                }
              }}
              className="w-full rounded-md border p-3 bg-white"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "جارٍ الحفظ..." : "حفظ المحاضرة"}
          </Button>

        </div>

         <hr className="my-10" />

        <h2 className="text-3xl font-bold mb-6">
          المحاضرات الموجودة
        </h2>

        <div className="space-y-4">

          {lectures.map((lecture) => (

            <div
              key={lecture.id}
              className="rounded-xl border bg-white p-5 flex justify-between items-center"
            >

              <div>

                <h3 className="text-xl font-bold">
                  {lecture.title}
                </h3>

                <p className="text-gray-500">
                  {lecture.chapters?.title}
                </p>

              </div>

              <div className="flex gap-3">

                <Button
                variant="outline"
                onClick={() => editLecture(lecture)}
              >
                ✏️ تعديل
              </Button>

                <Button
                  variant="destructive"
                  onClick={() => deleteLecture(lecture.id)}
                >
                  🗑 حذف
                </Button>

              </div>

            </div>

          ))}

        </div>       



      </main>
    );
}