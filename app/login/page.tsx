"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  async function login() {
    if (!email || !password) {
      alert("املأ جميع البيانات");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("✅ تم تسجيل الدخول");

    router.push("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">

      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">

        <h1 className="text-3xl font-bold mb-8 text-center">
          تسجيل الدخول
        </h1>

        <div className="space-y-4">

          <Input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            className="w-full"
            onClick={login}
            disabled={loading}
          >
            {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
          </Button>

        </div>

      </div>

    </main>
  );
}