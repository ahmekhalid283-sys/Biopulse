"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const router = useRouter();

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      return;
    }

    router.replace("/login");
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-cyan-500/20 bg-slate-900/80 p-8 shadow-2xl">

        <h1 className="mb-8 text-center text-4xl font-bold text-cyan-400">
          الإعدادات
        </h1>

        <div className="space-y-4">

          <button
            onClick={() => router.push("/profile")}
            className="w-full rounded-xl border border-cyan-500/20 bg-slate-800 py-4 text-left text-white transition hover:bg-slate-700"
          >
            👤 الملف الشخصي
          </button>

          <button
            onClick={() => router.push("/reset-password")}
            className="w-full rounded-xl border border-cyan-500/20 bg-slate-800 py-4 text-left text-white transition hover:bg-slate-700"
          >
            🔒 تغيير كلمة المرور
          </button>

          <button
            onClick={() => router.push("/forgot-password")}
            className="w-full rounded-xl border border-cyan-500/20 bg-slate-800 py-4 text-left text-white transition hover:bg-slate-700"
          >
            📩 إعادة إرسال رابط تغيير كلمة المرور
          </button>

          <button
            onClick={logout}
            className="w-full rounded-xl bg-red-600 py-4 font-bold text-white transition hover:bg-red-700"
          >
            تسجيل الخروج
          </button>

        </div>
      </div>
    </main>
  );
}