"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Props = {
  onSwitch: () => void;
};

export default function RegisterForm({ onSwitch }: Props) {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [governorate, setGovernorate] = useState("");
    const [school, setSchool] = useState("");
    const [grade, setGrade] = useState("الثالث الثانوي");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const register = async () => {
      if (password !== confirmPassword) {
        alert("كلمتا المرور غير متطابقتين");
        return;
      }

      try {
        setLoading(true);

        const email = `${phone}@biopulse.app`;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          alert(error.message);
          return;
        }

        if (!data.user) {
          alert("فشل إنشاء المستخدم");
          return;
        }

        const { error: studentError } = await supabase
          .from("students")
          .insert({
            auth_id: data.user.id,
            email,
            phone,
            full_name: fullName,
            governorate,
            school,
            grade,
          });

        if (studentError) {
          alert(studentError.message);
          return;
        }

        router.replace("/dashboard");
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl">

      <h2 className="text-4xl font-bold text-center text-white">
        إنشاء حساب
      </h2>

      <p className="mt-2 text-center text-slate-400">
        أنشئ حسابك وابدأ رحلة BioPulse
      </p>

      <div className="mt-8 space-y-4">

        <div>
          <label className="mb-2 block text-white">
            الاسم بالكامل
          </label>

          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ahmed Khaled"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-white">
            رقم الهاتف
          </label>

          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-white">
            المحافظة
          </label>

          <input
            type="text"
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            placeholder="المنوفية"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-white">
            المدرسة
          </label>

          <input
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="اسم المدرسة"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-white">
            الصف الدراسي
          </label>

          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          >
            <option>الأول الثانوي</option>
            <option>الثاني الثانوي</option>
            <option>الثالث الثانوي</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-white">
            كلمة المرور
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-white">
            تأكيد كلمة المرور
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="********"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
          />
        </div>

        <button
          onClick={register}
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-cyan-500 py-3 text-lg font-bold text-white transition hover:bg-cyan-600 disabled:opacity-50"
        >
          {loading ? "جارى إنشاء الحساب..." : "إنشاء الحساب"}
        </button>

      </div>

      <div className="mt-8 border-t border-slate-700 pt-6 text-center">

        <span className="text-slate-400">
          لديك حساب بالفعل؟
        </span>

        <button
          onClick={onSwitch}
          className="mr-2 font-bold text-cyan-400 hover:text-cyan-300"
        >
          تسجيل الدخول
        </button>

      </div>

    </div>
  );
}