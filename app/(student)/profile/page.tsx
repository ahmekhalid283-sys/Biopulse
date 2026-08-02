"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Student = {
  full_name: string;
  email: string;
  phone: string;
  governorate: string;
  grade: string;
  avatar_url?: string;
};

const governorates = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية",
  "الشرقية",
  "الغربية",
  "الموفوفية",
  "القليوبية",
  "البحيرة",
  "كفر الشيخ",
  "الغربية",
  "المنوفية",
  "الفيوم",
  "بني سويف",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "أسوان",
  "الأقصر",
  "البحر الأحمر",
  "الوادي الجديد",
  "مطروح",
  "شمال سيناء",
  "جنوب سيناء",
  "بورسعيد",
  "السويس",
  "الإسماعيلية"
];

export default function ProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [grade, setGrade] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const loadStudent = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("students")
        .select("full_name,email,phone,governorate,grade,avatar_url")
        .eq("auth_id", user.id)
        .single();

      if (data) {
        setStudent(data);

        setFullName(data.full_name);
        setEmail(data.email);
        setPhone(data.phone);
        setGovernorate(data.governorate);
        setGrade(data.grade);
        setAvatarUrl(data.avatar_url || "");
      }

      setLoading(false);
    };

    loadStudent();
  }, []);

  const uploadAvatar = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const fileName = `${user.id}-${Date.now()}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    if (error) {
      alert(error.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    setAvatarUrl(publicUrl);

    await supabase
      .from("students")
      .update({
        avatar_url: publicUrl,
      })
      .eq("auth_id", user.id);

    alert("تم رفع الصورة");
  };

  const saveProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("students")
      .update({
        full_name: fullName,
        phone,
        governorate,
        grade,
      })
      .eq("auth_id", user.id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("تم حفظ البيانات بنجاح");
  };

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

        <div className="space-y-5">

          <div className="mb-8 flex flex-col items-center">
            <img
              src={avatarUrl || "/images/default-avatar.png"}
              alt=""
              className="h-36 w-36 rounded-full border-4 border-cyan-400 object-cover"
            />

            <label className="mt-4 cursor-pointer rounded-xl bg-cyan-500 px-6 py-2 text-white hover:bg-cyan-600 transition">
              تغيير الصورة
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={uploadAvatar}
              />
            </label>
          </div>

          <div>
            <label className="mb-2 block text-cyan-400">
              الاسم بالكامل
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-cyan-400">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-slate-400 outline-none cursor-not-allowed"
            />
          </div>

          <div>
            <label className="mb-2 block text-cyan-400">
              رقم الهاتف
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-cyan-400">
              المحافظة
            </label>
            <select
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            >
              <option value="" disabled>اختر المحافظة</option>
              {governorates.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-cyan-400">
              الصف الدراسي
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            >
              <option value="" disabled>اختر الصف الدراسي</option>
              <option>الأول الثانوي</option>
              <option>الثاني الثانوي</option>
              <option>الثالث الثانوي</option>
            </select>
          </div>

          <button
            onClick={saveProfile}
            className="mt-8 w-full rounded-xl bg-cyan-500 py-3 font-bold text-white transition hover:bg-cyan-600"
          >
            حفظ التعديلات
          </button>

        </div>

      </div>
    </main>
  );
}