"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Student = {
  full_name: string;
  email: string;
  avatar_url?: string;
  average_score: number;
  total_exams: number;
  rank: number;
};

export default function ProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [lecturesWatched, setLecturesWatched] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadStudent = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("students")
        .select(`
          full_name,
          email,
          avatar_url,
          average_score,
          total_exams,
          rank
        `)
        .eq("auth_id", user.id)
        .single();

      if (data) {
        setStudent(data);
      }

      const { count: lecturesCount } = await supabase
        .from("lecture_progress")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("student_id", user.id)
        .eq("completed", true);

      setLecturesWatched(lecturesCount || 0);

      setLoading(false);
    };

    loadStudent();
  }, []);

  async function uploadAvatar(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file || !student) return;

    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        upsert: true,
      });

    if (uploadError) {
      alert(uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const publicUrl = data.publicUrl;

    await supabase
      .from("students")
      .update({
        avatar_url: publicUrl,
      })
      .eq("auth_id", user.id);

    setStudent({
      ...student,
      avatar_url: publicUrl,
    });

    setUploading(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        جاري التحميل...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <div className="mx-auto max-w-3xl rounded-3xl border border-cyan-500/20 bg-slate-900/80 p-8">
        <h1 className="mb-8 text-center text-4xl font-bold text-cyan-400">
          الملف الشخصي
        </h1>

        <div className="flex flex-col items-center">
          <div className="relative">
            <img
              src={student?.avatar_url || "/images/default-avatar.png"}
              className="w-36 h-36 rounded-full border-4 border-cyan-400 object-cover cursor-pointer hover:scale-105 transition duration-300"
              onClick={() =>
                setPreviewImage(
                  student?.avatar_url || "/images/default-avatar.png"
                )
              }
              alt=""
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={uploadAvatar}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 rounded-full bg-cyan-500 px-3 py-1 text-xs font-bold text-white hover:bg-cyan-600"
            >
              {uploading ? "..." : "تغيير"}
            </button>
          </div>

          <h2 className="mt-5 text-3xl font-bold text-white">
            {student?.full_name}
          </h2>
          <p className="text-slate-400">
            {student?.email}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-950 p-6 text-center border border-cyan-500/20">
            <p className="text-slate-400">الامتحانات</p>
            <p className="text-4xl font-black text-cyan-400">
              {student?.total_exams ?? 0}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-6 text-center border border-cyan-500/20">
            <p className="text-slate-400">المتوسط</p>
            <p className="text-4xl font-black text-green-400">
              {student?.average_score ?? 0}%
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-6 text-center border border-cyan-500/20">
            <p className="text-slate-400">الترتيب</p>
            <p className="text-4xl font-black text-yellow-400">
              #{student?.rank ?? "-"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-6 text-center border border-cyan-500/20">
            <p className="text-slate-400">المحاضرات المكتملة</p>
            <p className="text-4xl font-black text-purple-400">
              {lecturesWatched}
            </p>
          </div>
        </div>

        <Link
          href="/profile/results"
          className="mt-10 block rounded-2xl bg-cyan-500 py-4 text-center text-lg font-bold text-white transition hover:bg-cyan-600"
        >
          📋 نتائج الامتحانات
        </Link>
      </div>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <img
            src={previewImage}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-2xl border-4 border-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}