"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const lectures = [
  {
    slug: "lecture-1",
    title: "المحاضرة الأولى",
    duration: "2 ساعة",
    status: "مفتوحة",
  },
  {
    slug: "lecture-2",
    title: "المحاضرة الثانية",
    duration: "1:45 ساعة",
    status: "مفتوحة",
  },
  {
    slug: "lecture-3",
    title: "المحاضرة الثالثة",
    duration: "2:10 ساعة",
    status: "مغلقة",
  },
];

export default function ChapterPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-2">
        الدعامة والحركة
      </h1>

      <p className="text-gray-500 mb-8">
        جميع المحاضرات الخاصة بالفصل
      </p>

      <div className="space-y-6">
        {lectures.map((lecture) => (
          <Card key={lecture.slug}>
            <CardHeader>
              <CardTitle>{lecture.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <p>⏱ {lecture.duration}</p>

              <p>
                الحالة:{" "}
                <span className="font-bold">
                  {lecture.status}
                </span>
              </p>

              <div className="flex gap-3">
                <a
                  href="/lectures/lecture-1"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white"
                >
                  🎥 مشاهدة
                </a>

                <Button variant="outline">
                  📄 PDF
                </Button>

                <Button variant="secondary">
                  📝 امتحان
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}