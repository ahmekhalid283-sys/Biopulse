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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950">

      {/* Background */}

      <div className="absolute inset-0">

        <img
          src="/images/background.jpg"
          alt=""
          className="h-full w-full object-cover opacity-20"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/70 to-slate-950" />

      </div>

      {/* Logo */}

      <div className="absolute top-10 flex flex-col items-center">

        <img
          src="/images/logo.png"
          alt="BioPulse"
          className="h-20 w-20"
        />

        <h1 className="mt-4 text-5xl font-extrabold tracking-wide text-cyan-400">
          BioPulse
        </h1>

        <p className="mt-2 text-slate-400">
          Learn Biology Smarter
        </p>

      </div>

      {/* Card */}

      <div className="relative z-10 mt-32 w-full px-6">

        <AuthCard />

      </div>

    </main>
  );
}