"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const chapters = [
  {
    title: "الدعامة والحركة",
    lectures: 7,
    progress: "0%",
  },
  {
    title: "الهرمونات",
    lectures: 4,
    progress: "0%",
  },
  {
    title: "التكاثر",
    lectures: 7,
    progress: "0%",
  },
  {
    title: "المناعة",
    lectures: 4,
    progress: "0%",
  },
  {
    title: "DNA / RNA",
    lectures: 8,
    progress: "0%",
  },
];

export default function ChaptersPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-8">
        الفصول الدراسية
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chapters.map((chapter) => (
          <Card key={chapter.title}>
            <CardHeader>
              <CardTitle>{chapter.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p>📚 عدد المحاضرات: {chapter.lectures}</p>

              <p>📈 نسبة الإنجاز: {chapter.progress}</p>

              <Button className="w-full">
                دخول الفصل
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}