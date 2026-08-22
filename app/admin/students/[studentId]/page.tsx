"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Mail,
  Phone,
  Trophy,
  User,
  ClipboardList,
  MessageCircle,
  Bell,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function StudentProfilePage() {
  const { studentId } = useParams<{ studentId: string }>();

  const [student, setStudent] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadStudent();
  }, []);

  async function loadStudent() {
    const { data: studentData, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .single();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setStudent(studentData);

    const { data: attemptsData } = await supabase
      .from("exam_attempts")
      .select(`
        *,
        exams(
          title,
          lectures(
            title,
            chapters(
              title
            )
          )
        )
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    setAttempts(attemptsData || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#070b14] p-6 lg:p-10">
        <div className="w-full">
          <div className="mb-8 h-6 w-32 animate-pulse rounded-lg bg-slate-800" />
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
            <div className="flex items-center gap-6">
              <div className="h-28 w-28 animate-pulse rounded-full bg-slate-800" />
              <div className="space-y-3">
                <div className="h-7 w-52 animate-pulse rounded-lg bg-slate-800" />
                <div className="h-4 w-72 animate-pulse rounded-lg bg-slate-800" />
                <div className="h-4 w-56 animate-pulse rounded-lg bg-slate-800" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!student) {
    return (
      <main dir="rtl" className="min-h-screen bg-[#070b14] p-6 lg:p-10">
        <div className="w-full">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
              <User className="h-7 w-7" />
            </div>

            <h2 className="text-2xl font-bold text-white">
              لم يتم العثور على الطالب
            </h2>

            <Link
              href="/admin/students"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              <ArrowRight className="h-4 w-4" />
              الرجوع للطلاب
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b14] text-white">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold text-blue-400">إدارة الطلاب</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              الملف الشخصي للطالب
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              بيانات الطالب وسجل أداءه في الامتحانات.
            </p>
          </div>

          <Link
            href="/admin/students"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-5 py-3 text-sm font-bold text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
          >
            <ArrowRight className="h-4 w-4" />
            الرجوع للطلاب
          </Link>
        </div>

        {/* Student Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-l from-blue-900 via-blue-800 to-blue-700" />

          <div className="relative p-6 pt-16 sm:p-8 sm:pt-16">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                {/* Avatar */}
                <button
                  type="button"
                  onClick={() =>
                    setPreviewImage(
                      student?.avatar_url || "/images/default-avatar.png"
                    )
                  }
                  className="group relative shrink-0"
                >
                  <img
                    src={
                      student?.avatar_url || "/images/default-avatar.png"
                    }
                    className="h-32 w-32 rounded-3xl border-4 border-slate-800 object-cover shadow-xl transition duration-300 group-hover:scale-[1.03]"
                    alt=""
                  />
                  <div className="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
                    <User className="h-4 w-4" />
                  </div>
                </button>

                {/* Student Info */}
                <div className="pb-1">
                  <h2 className="text-3xl font-bold text-white">
                    {student.full_name}
                  </h2>

                  <div className="mt-3 flex flex-col gap-2 text-sm text-slate-400 sm:flex-row sm:gap-5">
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-400" />
                      {student.email || "لا يوجد بريد"}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-400" />
                      {student.phone || "لا يوجد رقم"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions & Status */}
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  href={`/admin/support/${student.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-500 hover:-translate-y-0.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  مراسلة الدعم العلمي
                </Link>

                <Link
                  href={`/admin/notifications/${student.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm font-bold text-amber-400 transition hover:bg-amber-500/20 hover:-translate-y-0.5"
                >
                  <Bell className="h-4 w-4" />
                  إشعارات الطالب
                </Link>

                <div className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  حساب نشط
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatCard
                icon={<ClipboardList className="h-5 w-5" />}
                label="عدد الامتحانات"
                value={student.total_exams ?? 0}
                tone="blue"
              />
              <StatCard
                icon={<Trophy className="h-5 w-5" />}
                label="متوسط الأداء"
                value={`${student.average_score ?? 0}%`}
                tone="green"
              />
              <StatCard
                icon={<Trophy className="h-5 w-5" />}
                label="الترتيب"
                value={`#${student.rank ?? "-"}`}
                tone="amber"
              />
            </div>
          </div>
        </section>

        {/* Attempts */}
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
          <div className="flex flex-col gap-2 border-b border-slate-800 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">سجل الامتحانات</h2>
              <p className="mt-1 text-sm text-slate-400">
                جميع محاولات الطالب ونتائجه السابقة.
              </p>
            </div>

            <div className="w-fit rounded-full bg-blue-500/15 px-4 py-2 text-sm font-bold text-blue-400">
              {attempts.length} محاولة
            </div>
          </div>

          {attempts.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                <ClipboardList className="h-7 w-7" />
              </div>
              <h3 className="font-bold text-white">لا توجد محاولات حتى الآن</h3>
              <p className="mt-1 text-sm text-slate-500">
                لم يقم الطالب بأداء أي امتحان بعد.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[900px]">
                  <thead className="bg-slate-900/80">
                    <tr className="border-b border-slate-800 text-right text-xs font-bold text-slate-400">
                      <th className="px-5 py-4">الفصل</th>
                      <th className="px-5 py-4">المحاضرة</th>
                      <th className="px-5 py-4">الامتحان</th>
                      <th className="px-5 py-4">الدرجة</th>
                      <th className="px-5 py-4">النسبة</th>
                      <th className="px-5 py-4">التاريخ</th>
                      <th className="px-5 py-4">التفاصيل</th>
                    </tr>
                  </thead>

                  <tbody>
                    {attempts.map((attempt) => {
                      const exam = attempt.exams;
                      const lecture = exam?.lectures;
                      const chapter = lecture?.chapters;
                      const percentage = Number(attempt.percentage || 0);

                      return (
                        <tr
                          key={attempt.id}
                          className="border-b border-slate-800/80 transition hover:bg-slate-800/40"
                        >
                          <td className="px-5 py-5 text-sm font-semibold text-slate-300">
                            {chapter?.title || "-"}
                          </td>
                          <td className="px-5 py-5 text-sm text-slate-400">
                            {lecture?.title || "-"}
                          </td>
                          <td className="px-5 py-5">
                            <span className="font-bold text-white">
                              {exam?.title || "-"}
                            </span>
                          </td>
                          <td className="px-5 py-5">
                            <span className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-bold text-slate-200">
                              {attempt.score}/{attempt.total}
                            </span>
                          </td>
                          <td className="px-5 py-5">
                            <span
                              className={`font-bold ${
                                percentage >= 80
                                  ? "text-emerald-400"
                                  : percentage >= 50
                                    ? "text-amber-400"
                                    : "text-red-400"
                              }`}
                            >
                              {Math.round(percentage)}%
                            </span>
                          </td>
                          <td className="px-5 py-5 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-2">
                              <CalendarDays className="h-4 w-4" />
                              {new Date(attempt.created_at).toLocaleDateString(
                                "ar-EG"
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-5">
                            <Link
                              href={`/admin/results/${attempt.id}`}
                              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500"
                            >
                              عرض النتيجة
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="space-y-4 p-4 md:hidden">
                {attempts.map((attempt) => {
                  const exam = attempt.exams;
                  const lecture = exam?.lectures;
                  const chapter = lecture?.chapters;
                  const percentage = Number(attempt.percentage || 0);

                  return (
                    <div
                      key={attempt.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-blue-400">
                            {chapter?.title || "-"}
                          </p>
                          <h3 className="mt-1 font-bold text-white">
                            {exam?.title || "-"}
                          </h3>
                          <p className="mt-1 text-sm text-slate-400">
                            {lecture?.title || "-"}
                          </p>
                        </div>

                        <span
                          className={`rounded-xl px-3 py-2 text-sm font-bold ${
                            percentage >= 80
                              ? "bg-emerald-500/15 text-emerald-400"
                              : percentage >= 50
                                ? "bg-amber-500/15 text-amber-400"
                                : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          {Math.round(percentage)}%
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-800 p-3">
                          <p className="text-xs text-slate-500">الدرجة</p>
                          <p className="mt-1 font-bold text-white">
                            {attempt.score}/{attempt.total}
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-800 p-3">
                          <p className="text-xs text-slate-500">التاريخ</p>
                          <p className="mt-1 text-sm font-bold text-white">
                            {new Date(attempt.created_at).toLocaleDateString(
                              "ar-EG"
                            )}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/admin/results/${attempt.id}`}
                        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white"
                      >
                        عرض النتيجة
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Image Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-md"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative">
            <img
              src={previewImage}
              alt=""
              className="max-h-[85vh] max-w-[90vw] rounded-3xl border-4 border-slate-700 object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-black text-slate-800 shadow-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: "blue" | "green" | "amber";
}) {
  const styles = {
    blue: "bg-blue-500/15 text-blue-400",
    green: "bg-emerald-500/15 text-emerald-400",
    amber: "bg-amber-500/15 text-amber-400",
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles[tone]}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}