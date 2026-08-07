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
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [governorate, setGovernorate] = useState("");
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
    <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/90 backdrop-blur-xl p-8 shadow-2xl" dir="rtl">

      <h2 className="text-5xl font-black text-center tracking-tight">
        <span className="text-white">
          Join BioPulse
        </span>
      </h2>

      <p className="mt-3 text-center text-slate-400 text-lg">
        أنشئ حسابك وابدأ رحلتك داخل{" "}
        <span className="text-cyan-400 font-semibold">
          BioPulse
        </span>
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
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-5 py-4 text-white placeholder:text-slate-500 transition-all duration-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-white">
            البريد الإلكتروني
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-5 py-4 text-white placeholder:text-slate-500 transition-all duration-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 outline-none"
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
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-5 py-4 text-white placeholder:text-slate-500 transition-all duration-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-white">
            المحافظة
          </label>

          <select
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-5 py-4 text-white placeholder:text-slate-500 transition-all duration-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 outline-none"
          >
            <option value="">اختر المحافظة</option>
            <option>القاهرة</option>
            <option>الجيزة</option>
            <option>الإسكندرية</option>
            <option>الدقهلية</option>
            <option>البحيرة</option>
            <option>المنوفية</option>
            <option>الغربية</option>
            <option>الشرقية</option>
            <option>القليوبية</option>
            <option>كفر الشيخ</option>
            <option>دمياط</option>
            <option>بورسعيد</option>
            <option>الإسماعيلية</option>
            <option>السويس</option>
            <option>بني سويف</option>
            <option>الفيوم</option>
            <option>المنيا</option>
            <option>أسيوط</option>
            <option>سوهاج</option>
            <option>قنا</option>
            <option>الأقصر</option>
            <option>أسوان</option>
            <option>مطروح</option>
            <option>الوادي الجديد</option>
            <option>شمال سيناء</option>
            <option>جنوب سيناء</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-white">
            الصف الدراسي
          </label>

          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-5 py-4 text-white placeholder:text-slate-500 transition-all duration-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 outline-none"
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
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-5 py-4 text-white placeholder:text-slate-500 transition-all duration-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 outline-none"
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
            className="w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-5 py-4 text-white placeholder:text-slate-500 transition-all duration-300 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 outline-none"
          />
        </div>

        <button
          onClick={register}
          disabled={loading}
          className="mt-3 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 py-4 text-lg font-bold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-cyan-500/40 active:scale-95 disabled:opacity-60"
        >
          {loading ? "جارى إنشاء الحساب..." : "إنشاء الحساب"}
        </button>

      </div>

      <div className="mt-10 border-t border-slate-800 pt-8 text-center">

        <span className="text-slate-400">
          لديك حساب بالفعل؟
        </span>

        <button
          onClick={onSwitch}
          className="mr-2 font-bold text-cyan-400 transition hover:text-cyan-300"
        >
          تسجيل الدخول
        </button>

      </div>

    </div>
  );
}