"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Chapter = {
  id: string;
  title: string;
  teacher: string;
  display_order: number;
};

export default function ChaptersPage() {
  const [title, setTitle] = useState("");
  const [teacher, setTeacher] = useState("");
  const [order, setOrder] = useState("");

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadChapters() {
    const { data } = await supabase
      .from("chapters")
      .select("*")
      .order("display_order");

    if (data) {
      setChapters(data);
    }
  }

  useEffect(() => {
    loadChapters();
  }, []);

  async function handleSave() {
    if (!title || !teacher || !order) {
      alert("املأ جميع البيانات");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("chapters")
      .insert({
        title,
        teacher,
        display_order: Number(order),
      });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setTitle("");
    setTeacher("");
    setOrder("");

    loadChapters();
  }

  return (
    <main className="max-w-5xl">

      <h1 className="text-4xl font-bold mb-8">
        إدارة الفصول
      </h1>

      <Card className="mb-8">
        <CardContent className="space-y-4 p-6">

          <Input
            placeholder="اسم الفصل"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            placeholder="اسم المدرس"
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
          />

          <Input
            type="number"
            placeholder="ترتيب الفصل"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
          />

          <Button
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "جارى الحفظ..." : "إضافة الفصل"}
          </Button>

        </CardContent>
      </Card>

      <div className="space-y-4">

        {chapters.map((chapter) => (
          <Card key={chapter.id}>
            <CardContent className="flex justify-between items-center p-5">

              <div>
                <h2 className="font-bold text-xl">
                  {chapter.title}
                </h2>

                <p className="text-gray-500">
                  {chapter.teacher}
                </p>
              </div>

              <span className="font-bold">
                #{chapter.display_order}
              </span>

            </CardContent>
          </Card>
        ))}

      </div>

    </main>
  );
}