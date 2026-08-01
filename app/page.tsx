"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: admin } = await supabase
        .from("admins")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (admin) {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    }

    checkUser();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <p className="text-xl">جارٍ التحويل...</p>
    </main>
  );
}