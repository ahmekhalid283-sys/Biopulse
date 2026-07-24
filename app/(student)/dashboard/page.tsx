"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function Dashboard() {
  const [student, setStudent] = useState<any>(null);
  const [topStudents, setTopStudents] = useState<any[]>([]);

  useEffect(() => {
    loadStudent();
    loadTopStudents();
  }, []);

  async function loadStudent() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const result = await supabase
      .from("students")
      .select("*")
      .eq("auth_id", user.id);

    if (result.data && result.data.length > 0) {
      setStudent(result.data[0]);
    }
  }

  async function loadTopStudents() {
    const { data, error } = await supabase
      .from("students")
      .select("full_name, average_score, total_exams")
      .order("average_score", { ascending: false })
      .limit(10);

    if (!error && data) {
      setTopStudents(data);
    }
  }

  if (!student) {
    return (
      <main className="p-8">
        <h2 className="text-2xl font-bold">
          جاري تحميل البيانات...
        </h2>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-8">

      <h1 className="text-4xl font-bold mb-8">
        أهلاً {student.full_name} 👋
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="rounded-xl border bg-white p-6 shadow">
          <p className="text-gray-500">
            عدد الامتحانات
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {student.total_exams}
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow">
          <p className="text-gray-500">
            متوسط الدرجات
          </p>

          <h2 className="text-4xl font-bold mt-2">
            {student.average_score}%
          </h2>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow">
          <p className="text-gray-500">
            الترتيب
          </p>

          <h2 className="text-4xl font-bold mt-2">
            #{student.rank}
          </h2>
        </div>

      </div>

      <div className="mt-10 rounded-xl border bg-white p-6 shadow">

        <h2 className="text-2xl font-bold mb-5">
          🚀 ابدأ التعلم
        </h2>

        <p className="text-gray-500 mb-5">
          اضغط هنا للدخول إلى جميع الفصول والمحاضرات.
        </p>

        <Link href="/chapters">
          <button className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700">
            📚 الذهاب إلى الفصول
          </button>
        </Link>

      </div>

      <div className="mt-10 rounded-xl border bg-white p-6 shadow">

        <h2 className="text-2xl font-bold mb-5">
          🏆 أفضل 10 طلاب
        </h2>

        {topStudents.length === 0 ? (

          <p className="text-gray-500">
            لا يوجد طلاب حتى الآن.
          </p>

        ) : (

          <div className="space-y-3">

            {topStudents.map((student, index) => (

              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-3"
              >

                <div>

                  <p className="font-bold">
                    #{index + 1} {student.full_name}
                  </p>

                  <p className="text-sm text-gray-500">
                    عدد الامتحانات: {student.total_exams}
                  </p>

                </div>

                <div className="text-xl font-bold text-green-600">
                  {student.average_score}%
                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      <div className="mt-10 rounded-xl border bg-white p-6 shadow">

        <h2 className="text-2xl font-bold mb-5">
          📈 إحصائياتك
        </h2>

        <div className="space-y-3">

          <div className="flex justify-between border-b pb-2">
            <span>عدد الامتحانات</span>
            <span>{student.total_exams}</span>
          </div>

          <div className="flex justify-between border-b pb-2">
            <span>متوسط الدرجات</span>
            <span>{student.average_score}%</span>
          </div>

          <div className="flex justify-between">
            <span>ترتيبك على المنصة</span>
            <span>#{student.rank}</span>
          </div>

        </div>

      </div>

    </main>
  );
}