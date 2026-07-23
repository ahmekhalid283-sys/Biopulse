"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type Exam = {
  id: string;
  title: string;
};

export default function QuestionsPage() {
  const [exams, setExams] = useState<Exam[]>([]);

  useEffect(() => {
    loadExams();
  }, []);

  async function loadExams() {
    const { data } = await supabase
      .from("exams")
      .select("id,title")
      .order("created_at", { ascending: false });

    if (data) setExams(data);
  }

  return (
    <main className="max-w-6xl mx-auto p-8">

      <h1 className="text-4xl font-bold mb-8">
        إدارة الأسئلة
      </h1>

      <div className="space-y-4">

        {exams.map((exam) => (

          <div
            key={exam.id}
            className="border rounded-xl p-5 flex justify-between items-center"
          >

            <h2 className="font-bold text-xl">
              {exam.title}
            </h2>

            <Button>
              إضافة أسئلة
            </Button>

          </div>

        ))}

      </div>

    </main>
  );
}