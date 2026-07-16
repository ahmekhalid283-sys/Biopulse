"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-blue-600 text-white min-h-screen p-6">
          <h1 className="text-3xl font-bold mb-10">BioPulse</h1>

          <nav className="space-y-4">
            <Button className="w-full">🏠 الرئيسية</Button>

            <Link href="/chapters">
              <Button className="w-full">
                📚 المحاضرات
              </Button>
            </Link>

            <Button className="w-full">📝 الامتحانات</Button>
            <Button className="w-full">🏆 الترتيب</Button>
            <Button className="w-full">⚙️ الحساب</Button>
          </nav>
        </aside>

        {/* Content */}
        <section className="flex-1 p-8">
          <h2 className="text-3xl font-bold">
            أهلاً أحمد 👋
          </h2>

          <p className="text-gray-500 mb-8">
            نتمنى لك يوماً دراسياً موفقاً
          </p>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>المحاضرات</CardTitle>
              </CardHeader>

              <CardContent className="text-3xl font-bold">
                25
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الامتحانات</CardTitle>
              </CardHeader>

              <CardContent className="text-3xl font-bold">
                12
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>متوسط الدرجات</CardTitle>
              </CardHeader>

              <CardContent className="text-3xl font-bold text-green-600">
                95%
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الترتيب</CardTitle>
              </CardHeader>

              <CardContent className="text-3xl font-bold text-blue-600">
                #7
              </CardContent>
            </Card>
          </div>

          {/* Last Lecture */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>آخر محاضرة</CardTitle>
            </CardHeader>

            <CardContent>
              الدعامة والحركة - المحاضرة الأولى
            </CardContent>
          </Card>

          {/* Last Exam */}
          <Card>
            <CardHeader>
              <CardTitle>آخر امتحان</CardTitle>
            </CardHeader>

            <CardContent>
              امتحان الدعامة والحركة
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}