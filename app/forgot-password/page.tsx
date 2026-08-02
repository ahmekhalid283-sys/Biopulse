"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const resetPassword = async () => {
    if (!email) {
      alert("أدخل البريد الإلكتروني");
      return;
    }

    try {
      setLoading(true);

      const { data: student, error } = await supabase
        .from("students")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        alert("حدث خطأ");
        return;
      }

      if (!student) {
        alert("لا يوجد حساب مرتبط بهذا البريد الإلكتروني");
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        alert(resetError.message);
        return;
      }

      alert("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-3xl border border-cyan-500/20 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">

        <h1 className="text-center text-3xl font-bold text-white">
          إعادة تعيين كلمة المرور
        </h1>

        <p className="mt-2 text-center text-slate-400">
          أدخل البريد الإلكتروني المرتبط بالحساب.
        </p>

        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-white text-sm">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            />
          </div>

          <button
            onClick={resetPassword}
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 py-3 font-bold text-white transition hover:bg-cyan-600 disabled:opacity-50"
          >
            {loading ? "جارٍ الإرسال..." : "إرسال رابط إعادة التعيين"}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-bold text-cyan-400 hover:text-cyan-300"
          >
            العودة لتسجيل الدخول
          </Link>
        </div>

      </div>
    </main>
  );
}