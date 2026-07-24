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

      // لو مش مسجل دخول
      if (!user) {
        router.replace("/login");
        return;
      }

      // نتأكد هل هو أدمن
      const { data: admin } = await supabase
        .from("admins")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (admin) {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    }

    checkUser();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-xl">جارٍ التحويل...</p>
    </main>
  );
}