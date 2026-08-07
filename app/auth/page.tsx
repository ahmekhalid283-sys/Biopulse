"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthCard from "@/components/auth/AuthCard";

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/dashboard");
      }
    };

    checkSession();
  }, [router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">

      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="/images/background.jpg"
          alt=""
          className="h-full w-full object-cover opacity-15"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/70" />

        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[150px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[180px]" />
      </div>

      <div className="relative z-10 flex min-h-screen">

        {/* Left */}
        <section className="hidden lg:flex w-1/2 flex-col justify-center px-20">

          <div className="max-w-xl">

            <h1 className="text-6xl font-black leading-tight">
              <span className="text-cyan-400">
                BioPulse
              </span>
            </h1>

            <p className="mt-5 text-2xl font-semibold text-white">
              منصة ذكية لتعلم الأحياء
            </p>

            <p className="mt-8 text-lg leading-9 text-slate-300">
              تعلم بطريقة حديثة، تابع تقدمك، نافس أصدقاءك،
              وحقق أعلى الدرجات من خلال منصة تعليمية
             .متكاملة صُممت خصيصًا لطلاب الثانوية العامة
            </p>

            <div className="mt-12 space-y-5">

              <div className="flex items-center gap-4 rounded-2xl border border-cyan-500/20 bg-slate-900/40 p-5 backdrop-blur-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-2xl">
                  📚
                </div>

                <div>
                  <h3 className="font-bold">
                    شرح احترافي
                  </h3>

                  <p className="text-sm text-slate-400">
                   .فيديوهات منظمة لكل فصل
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-cyan-500/20 bg-slate-900/40 p-5 backdrop-blur-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-2xl">
                  🧠
                </div>

                <div>
                  <h3 className="font-bold">
                    امتحانات ذكية
                  </h3>

                  <p className="text-sm text-slate-400">
                   .تحليل كامل للأداء بعد كل اختبار
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-cyan-500/20 bg-slate-900/40 p-5 backdrop-blur-xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-2xl">
                  🏆
                </div>

                <div>
                  <h3 className="font-bold">
                    لوحة المتصدرين
                  </h3>

                  <p className="text-sm text-slate-400">
                   .نافس أفضل الطلاب باستمرار
                  </p>
                </div>
              </div>

            </div>

          </div>

        </section>

        {/* Right */}
        <section className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2">

          <div className="w-full max-w-md">
            <AuthCard />
          </div>

        </section>

      </div>

    </main>
  );
}