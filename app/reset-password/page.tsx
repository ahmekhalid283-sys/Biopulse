"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const updatePassword = async () => {
    if (password.length < 6) {
      alert("كلمة المرور يجب ألا تقل عن 6 أحرف");
      return;
    }

    if (password !== confirmPassword) {
      alert("كلمتا المرور غير متطابقتين");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        alert(error.message);
        return;
      }

      alert("تم تغيير كلمة المرور بنجاح");

      router.replace("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <div className="w-full max-w-md rounded-3xl border border-cyan-500/20 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">

        <h1 className="text-center text-3xl font-bold text-white">
          كلمة مرور جديدة
        </h1>

        <p className="mt-2 text-center text-slate-400">
          أدخل كلمة المرور الجديدة.
        </p>

        <div className="mt-8 space-y-4">

          <div>
            <label className="mb-2 block text-white text-sm">
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-white text-sm">
              تأكيد كلمة المرور
            </label>
            <input
              type="password"
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            />
          </div>

          <button
            onClick={updatePassword}
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 py-3 font-bold text-white transition hover:bg-cyan-600 disabled:opacity-50"
          >
            {loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
          </button>

        </div>

      </div>
    </main>
  );
}