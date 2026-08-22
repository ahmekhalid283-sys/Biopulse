"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Student = {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
};

type ProfileStats = {
  average_score: number;
  total_exams: number;
  rank: number;
};

export default function ProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);

  const [stats, setStats] = useState<ProfileStats>({
    average_score: 0,
    total_exams: 0,
    rank: 0,
  });

  const [lecturesWatched, setLecturesWatched] = useState(0);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);

      // =========================
      // 1. المستخدم الحالي
      // =========================

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Auth error:", authError);
        return;
      }

      if (!user) {
        window.location.href = "/auth";
        return;
      }

      // =========================
      // 2. بيانات الطالب
      // =========================

      const {
        data: studentData,
        error: studentError,
      } = await supabase
        .from("students")
        .select("id, full_name, email, avatar_url")
        .eq("auth_id", user.id)
        .single();

      if (studentError || !studentData) {
        console.error("Student error:", studentError);
        return;
      }

      setStudent(studentData);

      const studentId = studentData.id;

      // =========================
      // 3. كل محاولات الامتحانات
      // =========================

      const {
        data: attemptsData,
        error: attemptsError,
      } = await supabase
        .from("exam_attempts")
        .select("student_id, percentage")
        .eq("student_id", studentId);

      if (attemptsError) {
        console.error("Attempts error:", attemptsError);
      }

      const attempts = attemptsData ?? [];

      const totalExams = attempts.length;

      const averageScore =
        totalExams === 0
          ? 0
          : attempts.reduce(
              (sum, attempt) =>
                sum + (Number(attempt.percentage) || 0),
              0
            ) / totalExams;

      // =========================
      // 4. حساب ترتيب الطالب
      // =========================

      const {
        data: allStudents,
        error: allStudentsError,
      } = await supabase
        .from("students")
        .select("id, full_name");

      if (allStudentsError) {
        console.error("Students leaderboard error:", allStudentsError);
      }

      let rank = 0;

      if (allStudents && allStudents.length > 0) {
        const studentIds = allStudents.map((s) => s.id);

        const {
          data: allAttempts,
          error: allAttemptsError,
        } = await supabase
          .from("exam_attempts")
          .select("student_id, percentage")
          .in("student_id", studentIds);

        if (allAttemptsError) {
          console.error(
            "All attempts error:",
            allAttemptsError
          );
        }

        const leaderboard = allStudents
          .map((s) => {
            const studentAttempts =
              (allAttempts ?? []).filter(
                (attempt) =>
                  attempt.student_id === s.id
              );

            const examCount = studentAttempts.length;

            const average =
              examCount === 0
                ? 0
                : studentAttempts.reduce(
                    (sum, attempt) =>
                      sum +
                      (Number(attempt.percentage) || 0),
                    0
                  ) / examCount;

            return {
              id: s.id,
              average: Number(average.toFixed(1)),
              exams: examCount,
            };
          })
          .filter((s) => s.exams > 0)
          .sort((a, b) => {
            // الأعلى في المتوسط أولاً
            if (b.average !== a.average) {
              return b.average - a.average;
            }

            // لو المتوسط متساوي، صاحب الامتحانات الأكثر يتقدم
            return b.exams - a.exams;
          });

        const currentIndex = leaderboard.findIndex(
          (s) => s.id === studentId
        );

        if (currentIndex !== -1) {
          rank = currentIndex + 1;
        }
      }

      // =========================
      // 5. المحاضرات المكتملة
      // تتحسب فقط عند تسليم امتحان
      // =========================

      const { data: studentAttemptsData, error: studentAttemptsError } = await supabase
        .from("exam_attempts")
        .select("exam_id")
        .eq("student_id", studentId);

      if (studentAttemptsError) {
        console.error("Completed lectures error:", studentAttemptsError);
      }

      // IDs الامتحانات التي سلّمها الطالب
      const examIds = [
        ...new Set(
          (studentAttemptsData ?? [])
            .map((attempt) => attempt.exam_id)
            .filter(Boolean)
        ),
      ];

      let completedLectures = 0;

      if (examIds.length > 0) {
        // نجيب الامتحانات ونعرف كل امتحان تابع لأي محاضرة
        const { data: examsData, error: examsError } = await supabase
          .from("exams")
          .select("id, lecture_id")
          .in("id", examIds);

        if (examsError) {
          console.error("Exams error:", examsError);
        } else {
          // كل محاضرة تتحسب مرة واحدة فقط
          const lectureIds = new Set(
            (examsData ?? [])
              .map((exam) => exam.lecture_id)
              .filter(Boolean)
          );

          completedLectures = lectureIds.size;
        }
      }

      // =========================
      // 6. تحديث البيانات
      // =========================

      setStats({
        total_exams: totalExams,
        average_score: Number(
          averageScore.toFixed(1)
        ),
        rank,
      });

      setLecturesWatched(completedLectures);
    } catch (error) {
      console.error("Profile loading error:", error);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // رفع الصورة
  // =========================

  async function uploadAvatar(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file || !student) return;

    try {
      setUploading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("يجب تسجيل الدخول أولاً");
        return;
      }

      // التحقق من نوع الصورة
      if (!file.type.startsWith("image/")) {
        alert("من فضلك اختر صورة فقط.");
        return;
      }

      // حد أقصى 5MB
      if (file.size > 5 * 1024 * 1024) {
        alert("حجم الصورة يجب ألا يتجاوز 5MB.");
        return;
      }

      const fileExt =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      const fileName = `${user.id}.${fileExt}`;

      const { error: uploadError } =
        await supabase.storage
          .from("avatars")
          .upload(fileName, file, {
            upsert: true,
            contentType: file.type,
          });

      if (uploadError) {
        console.error(uploadError);
        alert(uploadError.message);
        return;
      }

      const { data } =
        supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: updateError } =
        await supabase
          .from("students")
          .update({
            avatar_url: publicUrl,
          })
          .eq("id", student.id);

      if (updateError) {
        console.error(updateError);
        alert(updateError.message);
        return;
      }

      setStudent((prev) =>
        prev
          ? {
              ...prev,
              avatar_url: publicUrl,
            }
          : prev
      );
    } catch (error) {
      console.error("Upload avatar error:", error);
      alert("حدث خطأ أثناء رفع الصورة.");
    } finally {
      setUploading(false);

      // السماح باختيار نفس الصورة مرة أخرى
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-400" />

          <p className="text-slate-400">
            جاري تحميل بيانات الملف الشخصي...
          </p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div dir="rtl" className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="mb-4 text-slate-400">
            لم يتم العثور على بيانات الطالب.
          </p>

          <Link
            href="/auth"
            className="rounded-xl bg-cyan-500 px-5 py-3 font-bold"
          >
            تسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 p-8 text-right">
      <div className="mx-auto max-w-3xl rounded-3xl border border-cyan-500/20 bg-slate-900/80 p-8">

        {/* ================= HEADER / BACK BUTTON ================= */}

        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-block rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-6 py-3 text-base font-bold text-cyan-400 transition hover:bg-cyan-500/20"
          >
            ← العودة للرئيسية
          </Link>

          <h1 className="text-3xl font-bold text-cyan-400">
            الملف الشخصي
          </h1>

          <div className="w-24" />
        </div>

        {/* ================= PROFILE ================= */}

        <div className="flex flex-col items-center">

          <div className="relative">

            <img
              src={
                student.avatar_url ||
                "/images/default-avatar.png"
              }
              className="h-36 w-36 cursor-pointer rounded-full border-4 border-cyan-400 object-cover transition duration-300 hover:scale-105"
              onClick={() =>
                setPreviewImage(
                  student.avatar_url ||
                    "/images/default-avatar.png"
                )
              }
              alt="صورة الطالب"
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={uploadAvatar}
            />

            <button
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={uploading}
              className="absolute bottom-1 left-1 rounded-full bg-cyan-500 px-3 py-1 text-xs font-bold text-white transition hover:bg-cyan-600 disabled:opacity-50"
            >
              {uploading ? "جاري..." : "تغيير"}
            </button>

          </div>

          <h2 className="mt-5 text-3xl font-bold text-white">
            {student.full_name}
          </h2>

          <p className="text-slate-400">
            {student.email}
          </p>

        </div>

        {/* ================= STATS ================= */}

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">

          {/* Exams */}

          <div className="rounded-2xl border border-cyan-500/20 bg-slate-950 p-6 text-center">

            <p className="text-slate-400">
              الامتحانات
            </p>

            <p className="text-4xl font-black text-cyan-400">
              {stats.total_exams}
            </p>

            <p className="mt-2 text-xs text-slate-600">
              عدد الامتحانات التي تم تسليمها
            </p>

          </div>

          {/* Average */}

          <div className="rounded-2xl border border-green-500/20 bg-slate-950 p-6 text-center">

            <p className="text-slate-400">
              المتوسط
            </p>

            <p className="text-4xl font-black text-green-400">
              {stats.average_score}%
            </p>

            <p className="mt-2 text-xs text-slate-600">
              متوسط نتائج جميع الامتحانات
            </p>

          </div>

          {/* Rank */}

          <div className="rounded-2xl border border-yellow-500/20 bg-slate-950 p-6 text-center">

            <p className="text-slate-400">
              الترتيب
            </p>

            <p className="text-4xl font-black text-yellow-400">
              {stats.rank > 0
                ? `#${stats.rank}`
                : "-"}
            </p>

            <p className="mt-2 text-xs text-slate-600">
              ترتيبك حسب متوسط الدرجات
            </p>

          </div>

          {/* Lectures */}

          <div className="rounded-2xl border border-purple-500/20 bg-slate-950 p-6 text-center">

            <p className="text-slate-400">
              المحاضرات المكتملة
            </p>

            <p className="text-4xl font-black text-purple-400">
              {lecturesWatched}
            </p>

            <p className="mt-2 text-xs text-slate-600">
              المحاضرات التي تم إنهاؤها
            </p>

          </div>

        </div>

        {/* ================= ACTION ================= */}

        <Link
          href="/profile/results"
          className="mt-10 block rounded-2xl bg-cyan-500 py-4 text-center text-lg font-bold text-white transition hover:bg-cyan-600"
        >
          📋 نتائج الامتحانات
        </Link>

      </div>

      {/* ================= IMAGE PREVIEW ================= */}

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
        >
          <img
            src={previewImage}
            alt="صورة الطالب"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl border-4 border-white object-contain shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          />
        </div>
      )}

    </main>
  );
}