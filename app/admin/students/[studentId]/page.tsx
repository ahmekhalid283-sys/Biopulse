"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
      <main className="p-10">
        <h2 className="text-2xl font-bold">جاري التحميل...</h2>
      </main>
    );
  }

  return (
    <main className="p-10 space-y-8">
      <Link
        href="/admin/students"
        className="text-blue-600 hover:underline"
      >
        ← الرجوع للطلاب
      </Link>

      <div className="bg-white rounded-xl shadow p-8 flex items-center gap-6">
        <img
          src={student?.avatar_url || "/images/default-avatar.png"}
          className="w-40 h-40 rounded-full border-4 border-cyan-400 object-cover cursor-pointer hover:scale-105 transition duration-300"
          alt=""
          onClick={() =>
            setPreviewImage(
              student?.avatar_url || "/images/default-avatar.png"
            )
          }
        />

        <div>
          <h1 className="text-3xl font-bold">
            {student.full_name}
          </h1>

          <p>{student.email}</p>
          <p>{student.phone}</p>

          <div className="mt-4 flex gap-8">
            <div>
              <span className="text-gray-500">عدد الامتحانات</span>
              <h2 className="text-2xl font-bold">
                {student.total_exams}
              </h2>
            </div>

            <div>
              <span className="text-gray-500">المتوسط</span>
              <h2 className="text-2xl font-bold text-green-600">
                {student.average_score}%
              </h2>
            </div>

            <div>
              <span className="text-gray-500">الترتيب</span>
              <h2 className="text-2xl font-bold text-yellow-500">
                #{student.rank}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4">الفصل</th>
              <th className="p-4">المحاضرة</th>
              <th className="p-4">الامتحان</th>
              <th className="p-4">الدرجة</th>
              <th className="p-4">النسبة</th>
              <th className="p-4">التاريخ</th>
              <th className="p-4">التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => {
              const exam = attempt.exams;
              const lecture = exam?.lectures;
              const chapter = lecture?.chapters;

              return (
                <tr
                  key={attempt.id}
                  className="border-t text-center"
                >
                  <td className="p-4">
                    {chapter?.title}
                  </td>

                  <td className="p-4">
                    {lecture?.title}
                  </td>

                  <td className="p-4">
                    {exam?.title}
                  </td>

                  <td className="p-4">
                    {attempt.score}/{attempt.total}
                  </td>

                  <td className="p-4">
                    {Math.round(attempt.percentage)}%
                  </td>

                  <td className="p-4">
                    {new Date(
                      attempt.created_at
                    ).toLocaleDateString("ar-EG")}
                  </td>

                  <td className="p-4">
                    <Link
                      href={`/admin/results/${attempt.id}`}
                      className="text-cyan-600 font-bold hover:underline"
                    >
                      عرض النتيجة
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt=""
            className="max-w-[90vw] max-h-[90vh] rounded-3xl shadow-2xl border-4 border-white"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </main>
  );
}