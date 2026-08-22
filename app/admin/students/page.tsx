"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  RefreshCw,
  Ban,
  Trash2,
  User,
} from "lucide-react";

type Student = {
  id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  is_banned?: boolean;
};

type Attempt = {
  id: string;
  student_id: string;
  percentage: number | null;
  score: number | null;
  total: number | null;
};

type StudentStats = {
  totalExams: number;
  averageScore: number;
  rank: number | null;
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [
        { data: studentsData, error: studentsError },
        { data: attemptsData, error: attemptsError },
      ] = await Promise.all([
        supabase
          .from("students")
          .select("id, full_name, email, phone, avatar_url, is_banned")
          .order("full_name", { ascending: true }),
        supabase
          .from("exam_attempts")
          .select("id, student_id, percentage, score, total"),
      ]);

      if (studentsError) {
        console.error(studentsError);
        alert(studentsError.message);
        return;
      }

      if (attemptsError) {
        console.error(attemptsError);
        alert(attemptsError.message);
        return;
      }

      setStudents(studentsData || []);
      setAttempts(attemptsData || []);
    } finally {
      setLoading(false);
    }
  }

  const studentStats = useMemo(() => {
    const stats: Record<string, StudentStats> = {};

    students.forEach((student) => {
      const studentAttempts = attempts.filter(
        (attempt) => attempt.student_id === student.id
      );

      const validPercentages = studentAttempts
        .map((attempt) => Number(attempt.percentage))
        .filter((percentage) => Number.isFinite(percentage));

      const averageScore =
        validPercentages.length > 0
          ? validPercentages.reduce((sum, percentage) => sum + percentage, 0) /
            validPercentages.length
          : 0;

      stats[student.id] = {
        totalExams: studentAttempts.length,
        averageScore: Number(averageScore.toFixed(2)),
        rank: null,
      };
    });

    const rankedStudents = students
      .filter((student) => {
        const stat = stats[student.id];
        return !student.is_banned && stat && stat.totalExams > 0;
      })
      .sort((a, b) => {
        const scoreA = stats[a.id].averageScore;
        const scoreB = stats[b.id].averageScore;

        if (scoreB !== scoreA) return scoreB - scoreA;
        return stats[b.id].totalExams - stats[a.id].totalExams;
      });

    rankedStudents.forEach((student, index) => {
      stats[student.id].rank = index + 1;
    });

    return stats;
  }, [students, attempts]);

  const filteredStudents = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return students;

    return students.filter(
      (student) =>
        student.full_name?.toLowerCase().includes(value) ||
        student.phone?.toLowerCase().includes(value) ||
        student.email?.toLowerCase().includes(value)
    );
  }, [students, search]);

  async function deleteStudent(id: string) {
    if (
      !confirm(
        "هل تريد حذف الطالب وجميع بياناته ومحاولاته وإشعاراته؟"
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      await supabase.from("notifications").delete().eq("student_id", id);

      const { error: attemptsError } = await supabase
        .from("exam_attempts")
        .delete()
        .eq("student_id", id);

      if (attemptsError) {
        alert(attemptsError.message);
        return;
      }

      const { error: studentError } = await supabase
        .from("students")
        .delete()
        .eq("id", id);

      if (studentError) {
        alert(studentError.message);
        return;
      }

      await loadData();
      alert("تم حذف الطالب وجميع بياناته بنجاح.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleBan(student: Student) {
    const { error } = await supabase
      .from("students")
      .update({ is_banned: !student.is_banned })
      .eq("id", student.id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadData();
  }

  const totalStudents = students.length;
  const activeStudents = students.filter((s) => !s.is_banned).length;
  const bannedStudents = students.filter((s) => s.is_banned).length;
  const totalAttempts = attempts.length;

  const highestAverage = Math.max(
    0,
    ...students.map((s) => studentStats[s.id]?.averageScore || 0)
  );

  const overallAverage =
    attempts.length > 0
      ? Number(
          (
            attempts.reduce(
              (sum, attempt) => sum + Number(attempt.percentage || 0),
              0
            ) / attempts.length
          ).toFixed(2)
        )
      : 0;

  return (
    <main dir="rtl" className="min-h-screen bg-[#070b14] text-white">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <Users className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-3xl font-bold sm:text-4xl">إدارة الطلاب</h1>
              <p className="mt-1 text-sm text-slate-400">
                الإحصائيات محسوبة من نتائج الامتحانات الفعلية.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 px-6 py-4">
            <p className="text-xs font-bold text-blue-400">إجمالي الطلاب</p>
            <p className="mt-1 text-3xl font-bold text-blue-300">
              {totalStudents}
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <p className="text-sm font-medium text-slate-400">إجمالي الطلاب</p>
            <p className="mt-2 text-3xl font-bold text-white">{totalStudents}</p>
            <p className="mt-1 text-xs text-slate-500">كل الطلاب المسجلين</p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <p className="text-sm font-medium text-emerald-400">الطلاب النشطون</p>
            <p className="mt-2 text-3xl font-bold text-emerald-300">
              {activeStudents}
            </p>
            <p className="mt-1 text-xs text-emerald-500/70">غير محظورين</p>
          </div>

          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
            <p className="text-sm font-medium text-red-400">الطلاب المحظورون</p>
            <p className="mt-2 text-3xl font-bold text-red-300">
              {bannedStudents}
            </p>
            <p className="mt-1 text-xs text-red-500/70">حسابات محظورة</p>
          </div>

          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5">
            <p className="text-sm font-medium text-violet-400">
              إجمالي المحاولات
            </p>
            <p className="mt-2 text-3xl font-bold text-violet-300">
              {totalAttempts}
            </p>
            <p className="mt-1 text-xs text-violet-500/70">
              محاولات الامتحانات الفعلية
            </p>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
            <p className="text-sm font-medium text-blue-400">متوسط النتائج</p>
            <p className="mt-2 text-3xl font-bold text-blue-300">
              {overallAverage}%
            </p>
            <p className="mt-1 text-xs text-blue-500/70">
              أعلى متوسط: {highestAverage}%
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="ابحث باسم الطالب أو رقم الهاتف أو البريد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-xl border-slate-700 bg-slate-800 pr-11 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-500" />
            <p className="font-bold text-slate-400">جاري تحميل البيانات...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-16 text-center">
            <div className="mb-4 text-5xl">👨‍🎓</div>
            <h2 className="text-xl font-bold text-white">لا يوجد طلاب</h2>
            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "لا توجد نتائج مطابقة للبحث."
                : "لم يتم تسجيل أي طالب حتى الآن."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1150px]">
                <thead className="bg-slate-900/80">
                  <tr className="border-b border-slate-800">
                    <th className="p-4 text-right text-xs font-bold text-slate-400">
                      الطالب
                    </th>
                    <th className="p-4 text-center text-xs font-bold text-slate-400">
                      الهاتف
                    </th>
                    <th className="p-4 text-center text-xs font-bold text-slate-400">
                      الامتحانات
                    </th>
                    <th className="p-4 text-center text-xs font-bold text-slate-400">
                      المتوسط
                    </th>
                    <th className="p-4 text-center text-xs font-bold text-slate-400">
                      الترتيب
                    </th>
                    <th className="p-4 text-center text-xs font-bold text-slate-400">
                      الحالة
                    </th>
                    <th className="p-4 text-center text-xs font-bold text-slate-400">
                      الإجراءات
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => {
                    const stats = studentStats[student.id];
                    const totalExams = stats?.totalExams || 0;
                    const averageScore = stats?.averageScore || 0;
                    const rank = stats?.rank || null;

                    return (
                      <tr
                        key={student.id}
                        className="border-b border-slate-800/80 transition hover:bg-slate-800/40"
                      >
                        {/* Student */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                student.avatar_url ||
                                "/images/default-avatar.png"
                              }
                              className="h-12 w-12 cursor-pointer rounded-full border-2 border-slate-700 object-cover transition hover:scale-105"
                              alt=""
                              onClick={() =>
                                setPreviewImage(
                                  student.avatar_url ||
                                    "/images/default-avatar.png"
                                )
                              }
                            />

                            <div>
                              <p className="font-bold text-white">
                                {student.full_name}
                              </p>
                              {student.email && (
                                <p className="text-xs text-slate-500">
                                  {student.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="p-4 text-center text-sm text-slate-400">
                          {student.phone || "—"}
                        </td>

                        {/* Exams */}
                        <td className="p-4 text-center">
                          <span className="inline-flex min-w-10 justify-center rounded-full bg-blue-500/15 px-3 py-1 text-sm font-bold text-blue-400">
                            {totalExams}
                          </span>
                        </td>

                        {/* Average */}
                        <td className="p-4 text-center">
                          {totalExams > 0 ? (
                            <span
                              className={`font-bold ${
                                averageScore >= 80
                                  ? "text-emerald-400"
                                  : averageScore >= 50
                                    ? "text-amber-400"
                                    : "text-red-400"
                              }`}
                            >
                              {averageScore}%
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-500">
                              لم يدخل امتحان
                            </span>
                          )}
                        </td>

                        {/* Rank */}
                        <td className="p-4 text-center">
                          {rank ? (
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${
                                rank === 1
                                  ? "bg-yellow-500/15 text-yellow-400"
                                  : rank === 2
                                    ? "bg-slate-500/20 text-slate-300"
                                    : rank === 3
                                      ? "bg-orange-500/15 text-orange-400"
                                      : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              #{rank}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4 text-center">
                          {student.is_banned ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-400">
                              <Ban className="h-3 w-3" />
                              محظور
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-400">
                              ● نشط
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex flex-wrap justify-center gap-2">
                            <Link href={`/admin/students/${student.id}`}>
                              <Button
                                variant="outline"
                                className="rounded-xl border-slate-700 bg-transparent font-bold text-slate-300 hover:bg-slate-800 hover:text-white"
                              >
                                الملف الشخصي
                              </Button>
                            </Link>

                            <Button
                              variant="outline"
                              onClick={() => toggleBan(student)}
                              className={`rounded-xl font-bold ${
                                student.is_banned
                                  ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                  : "border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                              }`}
                            >
                              {student.is_banned ? "إلغاء الحظر" : "حظر"}
                            </Button>

                            <Button
                              variant="destructive"
                              onClick={() => deleteStudent(student.id)}
                              className="rounded-xl bg-red-600 font-bold hover:bg-red-500"
                            >
                              <Trash2 className="ml-1 h-4 w-4" />
                              حذف
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
        >
          <div className="relative">
            <img
              src={previewImage}
              className="max-h-[90vh] max-w-[90vw] rounded-3xl border-4 border-slate-700 object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              alt=""
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-black text-slate-800 shadow-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
}