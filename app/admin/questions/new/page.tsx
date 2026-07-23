"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Exam = {
  id: string;
  title: string;
};

export default function NewQuestionPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [examId, setExamId] = useState("");

  const [question, setQuestion] = useState("");
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [d, setD] = useState("");

  const [correct, setCorrect] = useState("A");

  const [marks, setMarks] = useState("1");
  const [order, setOrder] = useState("1");

  const [explanation, setExplanation] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  async function loadExams() {
    const { data } = await supabase
      .from("exams")
      .select("id,title")
      .order("created_at", { ascending: false });

    if (data) {
      setExams(data);

      if (data.length) {
        setExamId(data[0].id);
      }
    }
  }

  async function saveQuestion() {
    if (
      !examId ||
      !question ||
      !a ||
      !b ||
      !c ||
      !d
    ) {
      alert("املأ جميع البيانات");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("questions")
      .insert({
        exam_id: examId,
        question,
        option_a: a,
        option_b: b,
        option_c: c,
        option_d: d,
        correct_answer: correct,
        marks: Number(marks),
        question_order: Number(order),
        explanation,
      });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("✅ تمت إضافة السؤال");

    setQuestion("");
    setA("");
    setB("");
    setC("");
    setD("");
    setExplanation("");
  }

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-5">

      <h1 className="text-4xl font-bold">
        إضافة سؤال
      </h1>

      <select
        value={examId}
        onChange={(e)=>setExamId(e.target.value)}
        className="w-full border rounded-md p-3"
      >
        {exams.map(exam=>(
          <option key={exam.id} value={exam.id}>
            {exam.title}
          </option>
        ))}
      </select>

      <Input
        placeholder="السؤال"
        value={question}
        onChange={(e)=>setQuestion(e.target.value)}
      />

      <Input
        placeholder="الاختيار A"
        value={a}
        onChange={(e)=>setA(e.target.value)}
      />

      <Input
        placeholder="الاختيار B"
        value={b}
        onChange={(e)=>setB(e.target.value)}
      />

      <Input
        placeholder="الاختيار C"
        value={c}
        onChange={(e)=>setC(e.target.value)}
      />

      <Input
        placeholder="الاختيار D"
        value={d}
        onChange={(e)=>setD(e.target.value)}
      />

      <select
        value={correct}
        onChange={(e)=>setCorrect(e.target.value)}
        className="w-full border rounded-md p-3"
      >
        <option>A</option>
        <option>B</option>
        <option>C</option>
        <option>D</option>
      </select>

      <Input
        type="number"
        placeholder="درجة السؤال"
        value={marks}
        onChange={(e)=>setMarks(e.target.value)}
      />

      <Input
        type="number"
        placeholder="ترتيب السؤال"
        value={order}
        onChange={(e)=>setOrder(e.target.value)}
      />

      <Input
        placeholder="شرح الإجابة (اختياري)"
        value={explanation}
        onChange={(e)=>setExplanation(e.target.value)}
      />

      <Button
        onClick={saveQuestion}
        disabled={loading}
      >
        {loading ? "جارٍ الحفظ..." : "حفظ السؤال"}
      </Button>

    </main>
  );
}