"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Props = {
  onSwitch: () => void;
};

export default function LoginForm({ onSwitch }: Props) {

    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const login = async () => {
      try {
        setLoading(true);

        const { data: student, error: studentError } = await supabase
          .from("students")
          .select("email")
          .eq("phone", phone)
          .single();

        if (studentError || !student) {
          alert("رقم الهاتف غير موجود");
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: student.email,
          password,
        });

        if (error) {
          alert("رقم الهاتف أو كلمة المرور غير صحيحة");
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
        مرحباً بعودتك
      </h2>

      <p className="mt-2 text-center text-slate-400">
        سجل دخولك واستمر في رحلتك التعليمية
      </p>

      <div className="mt-8 space-y-5">

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

        <div className="flex items-center justify-between text-sm">

          <label className="flex items-center gap-2 text-slate-300">

            <input type="checkbox" />

            تذكرني

          </label>

          <button
            type="button"
            className="text-cyan-400 hover:text-cyan-300"
          >
            نسيت كلمة المرور؟
          </button>

        </div>

        <button
          onClick={login}
          disabled={loading}
          className="mt-2 w-full rounded-xl bg-cyan-500 py-3 text-lg font-bold text-white transition hover:bg-cyan-600"
        >
          {loading ? "جارى تسجيل الدخول..." : "تسجيل الدخول"}
        </button>

      </div>

      <div className="mt-8 border-t border-slate-700 pt-6 text-center">

        <span className="text-slate-400">
          ليس لديك حساب؟
        </span>

        <button
          onClick={onSwitch}
          className="mr-2 font-bold text-cyan-400 hover:text-cyan-300"
        >
          إنشاء حساب
        </button>

      </div>

    </div>
  );
}