"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("rank");

    if (error) {
      alert(error.message);
      return;
    }

    setStudents(data || []);
    setFiltered(data || []);
  }

  function handleSearch(value: string) {
    setSearch(value);

    const result = students.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(value.toLowerCase()) ||
        s.phone?.includes(value)
    );

    setFiltered(result);
  }

  async function deleteStudent(id: string) {
    if (!confirm("حذف الطالب؟")) return;

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadStudents();
  }

  async function toggleBan(student: any) {
    const { error } = await supabase
      .from("students")
      .update({
        is_banned: !student.is_banned,
      })
      .eq("id", student.id);

    if (error) {
      alert(error.message);
      return;
    }

    loadStudents();
  }

  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold mb-8">
        إدارة الطلاب
      </h1>

      <Input
        placeholder="بحث بالاسم أو رقم الهاتف"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
      />

      <div className="mt-8 rounded-xl border bg-white overflow-hidden shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead className="bg-slate-100">
            <tr>
              <th className="p-4">الصورة</th>
              <th className="p-4">الاسم</th>
              <th className="p-4">الموبايل</th>
              <th className="p-4">الامتحانات</th>
              <th className="p-4">المتوسط</th>
              <th className="p-4">الترتيب</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((student) => (
              <tr key={student.id} className="border-t hover:bg-slate-50">
                <td className="p-4">
                  <img
                    src={student.avatar_url || "/images/default-avatar.png"}
                    className="w-12 h-12 rounded-full object-cover border cursor-pointer hover:scale-110 transition"
                    alt=""
                    onClick={() =>
                      setPreviewImage(student.avatar_url || "/images/default-avatar.png")
                    }
                  />
                </td>

                <td className="p-4 font-bold">
                  {student.full_name}
                </td>

                <td className="p-4">
                  {student.phone}
                </td>

                <td className="p-4">
                  {student.total_exams}
                </td>

                <td className="p-4">
                  {student.average_score}%
                </td>

                <td className="p-4">
                  #{student.rank}
                </td>

                <td className="p-4">
                  {student.is_banned ? (
                    <span className="text-red-600 font-bold">
                      🚫 محظور
                    </span>
                  ) : (
                    <span className="text-green-600 font-bold">
                      ✅ نشط
                    </span>
                  )}
                </td>

                <td className="p-4 flex gap-2 flex-wrap items-center">
                  <Link href={`/admin/students/${student.id}`}>
                    <Button variant="outline">
                      الملف الشخصي
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    onClick={() => toggleBan(student)}
                  >
                    {student.is_banned ? "إلغاء الحظر" : "حظر"}
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => deleteStudent(student.id)}
                  >
                    حذف
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
        >
          <img
            src={previewImage}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            alt=""
          />
        </div>
      )}
    </main>
  );
}