"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type Question = {
  id: string;
  exam_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
  question_order: number;
  marks: number;
  created_at: string;
};

export default function ExamQuestionsPage() {
  const { examId } = useParams<{ examId: string }>();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [marks, setMarks] = useState(1);
  const [questionOrder, setQuestionOrder] = useState(1);
  const [explanation, setExplanation] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (examId) {
      loadQuestions();
    }
  }, [examId]);

  async function loadQuestions() {
    setLoading(true);

    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", examId)
      .order("question_order");

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setQuestions(data || []);
    setLoading(false);
  }

  async function addQuestion() {
    if (!question || !optionA || !optionB || !optionC || !optionD) {
      alert("املأ جميع البيانات الأساسية");
      return;
    }

    setSaving(true);

    if (editingId) {
      const { error } = await supabase
        .from("questions")
        .update({
          question,
          option_a: optionA,
          option_b: optionB,
          option_c: optionC,
          option_d: optionD,
          correct_answer: correctAnswer,
          explanation,
          marks,
          question_order: questionOrder,
        })
        .eq("id", editingId);

      if (error) {
        setSaving(false);
        alert(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from("questions")
        .insert({
          exam_id: examId,
          question,
          option_a: optionA,
          option_b: optionB,
          option_c: optionC,
          option_d: optionD,
          correct_answer: correctAnswer,
          explanation,
          marks,
          question_order: questionOrder,
        });

      if (error) {
        setSaving(false);
        alert(error.message);
        return;
      }
    }

    // إعادة تعيين الحقول
    setQuestion("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectAnswer("A");
    setMarks(1);
    setQuestionOrder(1);
    setExplanation("");
    setEditingId(null);
    setSaving(false);

    loadQuestions();
  }

  function startEditQuestion(q: Question) {
    setEditingId(q.id);
    setQuestion(q.question);
    setOptionA(q.option_a);
    setOptionB(q.option_b);
    setOptionC(q.option_c);
    setOptionD(q.option_d);
    setCorrectAnswer(q.correct_answer);
    setExplanation(q.explanation || "");
    setMarks(q.marks);
    setQuestionOrder(q.question_order);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }



  async function deleteQuestion(id: string) {
    const ok = confirm("هل تريد حذف السؤال؟");

    if (!ok) return;

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("تم حذف السؤال");

    loadQuestions();
  }
  return (
    <main className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">إدارة أسئلة الامتحان</h1>
        <p className="text-gray-500 mt-2 mb-6">عدد الأسئلة: {questions.length}</p>

        <div className="rounded-xl border bg-white p-6 space-y-4 shadow-sm">
          <input
            className="w-full rounded-md border p-3"
            placeholder="السؤال"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          <input
            className="w-full rounded-md border p-3"
            placeholder="الاختيار A"
            value={optionA}
            onChange={(e) => setOptionA(e.target.value)}
          />

          <input
            className="w-full rounded-md border p-3"
            placeholder="الاختيار B"
            value={optionB}
            onChange={(e) => setOptionB(e.target.value)}
          />

          <input
            className="w-full rounded-md border p-3"
            placeholder="الاختيار C"
            value={optionC}
            onChange={(e) => setOptionC(e.target.value)}
          />

          <input
            className="w-full rounded-md border p-3"
            placeholder="الاختيار D"
            value={optionD}
            onChange={(e) => setOptionD(e.target.value)}
          />

          <select
            className="w-full rounded-md border p-3"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>

          <input
            type="number"
            className="w-full rounded-md border p-3"
            placeholder="درجة السؤال"
            value={marks}
            onChange={(e) => setMarks(Number(e.target.value))}
          />

          <input
            type="number"
            className="w-full rounded-md border p-3"
            placeholder="ترتيب السؤال"
            value={questionOrder}
            onChange={(e) => setQuestionOrder(Number(e.target.value))}
          />

          <textarea
            className="w-full rounded-md border p-3"
            placeholder="شرح الإجابة (اختياري)"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />

          <Button onClick={addQuestion} disabled={saving} className="w-full">
            {editingId ? "💾 حفظ التعديل" : "➕ إضافة السؤال"}
          </Button>
        </div>
      </div>

      {loading ? (
        <p>جارٍ تحميل الأسئلة...</p>
      ) : questions.length === 0 ? (
        <div className="rounded-xl border p-10 text-center text-gray-500">
          لا توجد أسئلة حتى الآن.
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q.id}
              className="rounded-xl border bg-white p-5 shadow-sm flex justify-between items-start"
            >
              <div>
                <h2 className="font-bold text-lg">
                  {q.question_order}. {q.question}
                </h2>

                <div className="mt-4 space-y-1 text-gray-700">
                  <p>A) {q.option_a}</p>
                  <p>B) {q.option_b}</p>
                  <p>C) {q.option_c}</p>
                  <p>D) {q.option_d}</p>
                </div>

                <div className="mt-4 text-green-600 font-semibold">
                  الإجابة الصحيحة: {q.correct_answer}
                </div>

                <div className="text-blue-600">الدرجة: {q.marks}</div>

                {q.explanation && (
                  <div className="mt-2 text-gray-500">
                    الشرح: {q.explanation}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => startEditQuestion(q)}>
                  ✏️ تعديل
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => deleteQuestion(q.id)}
                >
                  🗑 حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}