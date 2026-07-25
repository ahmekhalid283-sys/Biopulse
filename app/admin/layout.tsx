"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

const links = [
  {
    href: "/admin",
    title: "📊 Dashboard",
  },
  {
    href: "/admin/students",
    title: "👨‍🎓 الطلاب",
  },
  {
    href: "/admin/chapters",
    title: "📚 الفصول",
  },
  {
    href: "/admin/lectures",
    title: "🎥 المحاضرات",
  },
  {
    href: "/admin/exams",
    title: "📝 الامتحانات",
  },
  {
    href: "/admin/questions",
    title: "❓ الأسئلة",
  },
  {
    href: "/admin/results",
    title: "🏆 النتائج",
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    console.log("Start check admin");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    console.log("User:", user);
    console.log("User Error:", userError);

    if (!user) {
      console.log("No user");
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("admins")
      .select("*")
      .eq("auth_id", user.id);

    console.log("Admins:", data);
    console.log("Admin Error:", error);

    if (error || !data || data.length === 0) {
      alert("غير مصرح لك بالدخول");
      router.replace("/dashboard");
      return;
    }

    console.log("Admin OK");
  }

  return (
    <div className="min-h-screen flex bg-slate-100">

      <aside className="w-72 bg-slate-900 text-white p-6">

        <h1 className="text-3xl font-bold mb-10">
          BioPulse Admin
        </h1>

        <div className="space-y-2">

          {links.map((item) => (

            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-4 py-3 transition ${
                pathname === item.href
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-800"
              }`}
            >
              {item.title}
            </Link>

          ))}

        </div>

      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>

    </div>
  );
}