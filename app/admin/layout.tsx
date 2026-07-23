import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-slate-100">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6">

        <h1 className="text-3xl font-bold mb-10">
          BioPulse Admin
        </h1>

        <nav className="space-y-4">

          <Link href="/admin" className="block hover:text-yellow-400">
            🏠 الرئيسية
          </Link>

          <Link href="/admin/chapters" className="block hover:text-yellow-400">
            📚 الفصول
          </Link>

          <Link href="/admin/lectures" className="block hover:text-yellow-400">
            🎥 المحاضرات
          </Link>

          <Link href="/admin/exams" className="block hover:text-yellow-400">
            📝 الامتحانات
          </Link>

          <Link href="/admin/questions" className="block hover:text-yellow-400">
            ❓ الأسئلة
          </Link>

          <Link href="/admin/students" className="block hover:text-yellow-400">
            👨‍🎓 الطلاب
          </Link>

          <Link href="/admin/results" className="block hover:text-yellow-400">
            📊 النتائج
          </Link>

        </nav>

      </aside>

      {/* Content */}
      <main className="flex-1 p-8">
        {children}
      </main>

    </div>
  );
}