"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [message, setMessage] = useState("جاري الاتصال...");

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase
        .from("students")
        .select("*")
        .limit(1);

      if (error) {
        if (error.code === "PGRST205" || error.message.includes("students")) {
          setMessage("✅ تم الاتصال بـ Supabase بنجاح (جدول students لم يتم إنشاؤه بعد)");
        } else {
          setMessage(`❌ ${error.message}`);
        }
      } else {
        setMessage("✅ تم الاتصال بقاعدة البيانات بنجاح");
      }
    }

    testConnection();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-bold text-blue-600">
        {message}
      </h1>
    </main>
  );
}