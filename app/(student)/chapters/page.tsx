"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Chapter = {
  id: string;
  title: string;
  slug: string;
};

export default function ChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChapters();
  }, []);

  async function loadChapters() {
    const { data, error } = await supabase
      .from("chapters")
      .select("id,title,slug")
      .order("display_order");

    if (!error && data) {
      setChapters(data);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold">
          جاري تحميل الفصول...
        </h2>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-4xl font-bold text-blue-600 mb-8">
        الفصول الدراسية
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {chapters.map((chapter) => (
          <Card key={chapter.id}>
            <CardHeader>
              <CardTitle>{chapter.title}</CardTitle>
            </CardHeader>

            <CardContent>
              <Link href={`/chapters/${chapter.slug}`}>
                <Button className="w-full">
                  دخول الفصل
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}

        {chapters.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              لا توجد فصول حتى الآن.
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}