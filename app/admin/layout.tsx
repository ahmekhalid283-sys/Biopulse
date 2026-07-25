"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  {
    href: "/admin",
    title: "📊 Dashboard",
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

  return (
    <div className="min-h-screen flex bg-slate-100">

      <aside className="w-72 bg-slate-900 text-white p-6">

        <h1 className="text-3xl font-bold mb-10">
          BioPulse
        </h1>

        <div className="space-y-2">

          {links.map((item) => (

            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-4 py-3 transition ${
                pathname === item.href
                  ? "bg-blue-600"
                  : "hover:bg-slate-800"
              }`}
            >
              {item.title}
            </Link>

          ))}

        </div>

      </aside>

      <main className="flex-1 p-8">
        {children}
      </main>

    </div>
  );
}