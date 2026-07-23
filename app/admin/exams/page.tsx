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
    <main className="max-w-4xl mx-auto p-8">

      <h1 className="text-4xl font-bold mb-8">
        إدارة الامتحانات
      </h1>

      <div className="space-y-5">

        <div>
          <label className="font-semibold block mb-2">
            المحاضرة
          </label>

          <select
            className="w-full rounded-md border p-3"
            value={lectureId}
            onChange={(e) => setLectureId(e.target.value)}
          >
            {lectures.map((lecture) => (
              <option key={lecture.id} value={lecture.id}>
                {lecture.title}
              </option>
            ))}
          </select>
        </div>

        <Input
          placeholder="اسم الامتحان"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Input
          type="number"
          placeholder="مدة الامتحان بالدقائق"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />

        <Input
          type="number"
          placeholder="الدرجة النهائية"
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />

        <div>
          <label className="block mb-2 font-semibold">
            موعد فتح الامتحان
          </label>

          <Input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">
            موعد غلق الامتحان
          </label>

          <Input
            type="datetime-local"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
          />
          مجاني
        </label>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          منشور
        </label>

        <Button
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? "جارٍ الحفظ..." : "إنشاء الامتحان"}
        </Button>

      </div>
    

    <hr className="my-10" />

<h2 className="text-3xl font-bold mb-5">
  الامتحانات الموجودة
</h2>

<div className="space-y-4">

  {exams.length === 0 ? (

    <div className="rounded-xl border border-dashed p-8 text-center text-gray-500">
      لا توجد امتحانات حتى الآن.
    </div>

  ) : (

    exams.map((exam) => (

      <div
        key={exam.id}
        className="flex items-center justify-between rounded-xl border bg-white p-5"
      >

        <div>

          <h3 className="text-xl font-bold">
            {exam.title}
          </h3>

          <p className="text-gray-500">
            📚 {exam.lectures?.title}
          </p>

          <p className="text-gray-500">
            ⏱ {exam.duration_minutes} دقيقة
          </p>

          <p className="text-gray-500">
            🎯 الدرجة: {exam.total_score}
          </p>

          <p className="mt-2">
            {exam.is_published ? (
              <span className="text-green-600 font-bold">
                ✅ منشور
              </span>
            ) : (
              <span className="text-red-600 font-bold">
                ❌ مخفي
              </span>
            )}
          </p>

        </div>

        <div className="flex gap-2">

          <Button
            variant="outline"
            onClick={() => editExam(exam)}
          >
            ✏️ تعديل
          </Button>

          <Button
            onClick={async () => {
              await supabase
                .from("exams")
                .update({
                  is_published: !exam.is_published,
                })
                .eq("id", exam.id);

              loadExams();
            }}
          >
            {exam.is_published ? "🙈 إخفاء" : "👁 نشر"}
          </Button>  

          <Button
            variant="destructive"
            onClick={() => deleteExam(exam.id)}
          >
            🗑 حذف
          </Button>

          <Link href={`/admin/questions/${exam.id}`}>
            <Button>
              ❓ الأسئلة
            </Button>
          </Link>

        </div>

      </div>

    ))

  )}

</div>

    </main>
  );
}