"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const chapters = [
  {
    slug: "support-and-movement",
    title: "الدعامة والحركة",
    lectures: 7,
    progress: "0%",
  },
  {
    slug: "hormones",
    title: "الهرمونات",
    lectures: 4,
    progress: "0%",
  },
  {
    slug: "reproduction",
    title: "التكاثر",
    lectures: 7,
    progress: "0%",
  },
  {
    slug: "immunity",
    title: "المناعة",
    lectures: 4,
    progress: "0%",
  },
  {
    slug: "dna-rna",
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
          <Card key={chapter.slug}>
            <CardHeader>
              <CardTitle>{chapter.title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p>📚 عدد المحاضرات: {chapter.lectures}</p>

              <p>📈 نسبة الإنجاز: {chapter.progress}</p>

              <Link href={`/chapters/${chapter.slug}`}>
                <Button className="w-full">
                  دخول الفصل
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}