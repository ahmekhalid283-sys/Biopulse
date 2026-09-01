"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Pencil,
  Trash2,
  Upload,
  X,
  Loader2,
  CircleHelp,
  ArrowRight,
} from "lucide-react";

type ExamQuestion = {
  id: string;
  exam_id: string;
  question: string;
  question_type?: "mcq" | "true_false" | "written";
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string | null;
  marks: number;
  question_order: number;
  question_image_url: string | null;
  option_a_image_url: string | null;
  option_b_image_url: string | null;
  option_c_image_url: string | null;
  option_d_image_url: string | null;
};

export default function ExamQuestionsAdminPage() {
  const params = useParams();
  const router = useRouter();
  const examId = (params.examId || params.id) as string;

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [questionType, setQuestionType] = useState<"mcq" | "true_false" | "written">("mcq");
  const [questionText, setQuestionText] = useState("");
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  const [questionImageFile, setQuestionImageFile] = useState<File | null>(null);

  const [optionA, setOptionA] = useState("");
  const [optionAImage, setOptionAImage] = useState<string | null>(null);
  const [optionAFile, setOptionAFile] = useState<File | null>(null);

  const [optionB, setOptionB] = useState("");
  const [optionBImage, setOptionBImage] = useState<string | null>(null);
  const [optionBFile, setOptionBFile] = useState<File | null>(null);

  const [optionC, setOptionC] = useState("");
  const [optionCImage, setOptionCImage] = useState<string | null>(null);
  const [optionCFile, setOptionCFile] = useState<File | null>(null);

  const [optionD, setOptionD] = useState("");
  const [optionDImage, setOptionDImage] = useState<string | null>(null);
  const [optionDFile, setOptionDFile] = useState<File | null>(null);

  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [marks, setMarks] = useState(1);
  const [questionOrder, setQuestionOrder] = useState(1);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const questionFileRef = useRef<HTMLInputElement | null>(null);
  const optionAFileRef = useRef<HTMLInputElement | null>(null);
  const optionBFileRef = useRef<HTMLInputElement | null>(null);
  const optionCFileRef = useRef<HTMLInputElement | null>(null);
  const optionDFileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (examId) loadQuestions();
  }, [examId]);

  async function loadQuestions() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("exam_questions")
        .select("*")
        .eq("exam_id", examId)
        .order("question_order", { ascending: true });

      if (error) {
        alert(error.message);
        return;
      }

      setQuestions((data as ExamQuestion[]) || []);
      setQuestionOrder((data?.length || 0) + 1);
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(file: File, folder: string) {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${folder}/${examId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("question-images")
      .upload(path, file);

    if (error) throw error;

    const { data } = supabase.storage.from("question-images").getPublicUrl(path);
    return data.publicUrl;
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    field: "question" | "optionA" | "optionB" | "optionC" | "optionD"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);

    if (field === "question") {
      setQuestionImage(preview);
      setQuestionImageFile(file);
    }
    if (field === "optionA") {
      setOptionAImage(preview);
      setOptionAFile(file);
    }
    if (field === "optionB") {
      setOptionBImage(preview);
      setOptionBFile(file);
    }
    if (field === "optionC") {
      setOptionCImage(preview);
      setOptionCFile(file);
    }
    if (field === "optionD") {
      setOptionDImage(preview);
      setOptionDFile(file);
    }
  }

  function removeImage(
    field: "question" | "optionA" | "optionB" | "optionC" | "optionD"
  ) {
    if (field === "question") {
      setQuestionImage(null);
      setQuestionImageFile(null);
    }
    if (field === "optionA") {
      setOptionAImage(null);
      setOptionAFile(null);
    }
    if (field === "optionB") {
      setOptionBImage(null);
      setOptionBFile(null);
    }
    if (field === "optionC") {
      setOptionCImage(null);
      setOptionCFile(null);
    }
    if (field === "optionD") {
      setOptionDImage(null);
      setOptionDFile(null);
    }
  }

  function resetForm() {
    setEditingId(null);
    setQuestionType("mcq");
    setQuestionText("");
    setQuestionImage(null);
    setQuestionImageFile(null);
    setOptionA("");
    setOptionAImage(null);
    setOptionAFile(null);
    setOptionB("");
    setOptionBImage(null);
    setOptionBFile(null);
    setOptionC("");
    setOptionCImage(null);
    setOptionCFile(null);
    setOptionD("");
    setOptionDImage(null);
    setOptionDFile(null);
    setCorrectAnswer("A");
    setMarks(1);
    setQuestionOrder(questions.length + 1);
  }

  async function syncExamTotals() {
    const { data, error } = await supabase
      .from("exam_questions")
      .select("marks")
      .eq("exam_id", examId);

    if (error) {
      console.error(error);
      return;
    }

    const questionsCount = data?.length || 0;
    const totalScore = (data || []).reduce(
      (sum, q) => sum + Number(q.marks || 0),
      0
    );

    await supabase
      .from("exams")
      .update({
        questions_count: questionsCount,
        total_score: totalScore,
      })
      .eq("id", examId);
  }

  async function addQuestion() {
    if (!questionText.trim()) {
      alert("اكتب نص السؤال");
      return;
    }
    if (questionType === "mcq" && (!optionA.trim() || !optionB.trim())) {
      alert("أكمل الاختيارات");
      return;
    }
    if (questionType === "true_false" && !["A", "B"].includes(correctAnswer)) {
      alert("اختر صح أو خطأ");
      return;
    }

    try {
      setSaving(true);
      setUploadingField("saving");

      let question_image_url = questionImage;
      let option_a_image_url = optionAImage;
      let option_b_image_url = optionBImage;
      let option_c_image_url = optionCImage;
      let option_d_image_url = optionDImage;

      if (questionImageFile) {
        question_image_url = await uploadImage(questionImageFile, "questions");
      } else if (questionImage?.startsWith("blob:")) {
        question_image_url = null;
      }

      if (optionAFile) {
        option_a_image_url = await uploadImage(optionAFile, "options");
      } else if (optionAImage?.startsWith("blob:")) {
        option_a_image_url = null;
      }

      if (optionBFile) {
        option_b_image_url = await uploadImage(optionBFile, "options");
      } else if (optionBImage?.startsWith("blob:")) {
        option_b_image_url = null;
      }

      if (optionCFile) {
        option_c_image_url = await uploadImage(optionCFile, "options");
      } else if (optionCImage?.startsWith("blob:")) {
        option_c_image_url = null;
      }

      if (optionDFile) {
        option_d_image_url = await uploadImage(optionDFile, "options");
      } else if (optionDImage?.startsWith("blob:")) {
        option_d_image_url = null;
      }

      const payload = {
        exam_id: examId,
        question: questionText.trim(),
        question_type: questionType,
        option_a:
          questionType === "true_false"
            ? "صح"
            : questionType === "written"
              ? null
              : optionA.trim() || null,
        option_b:
          questionType === "true_false"
            ? "خطأ"
            : questionType === "written"
              ? null
              : optionB.trim() || null,
        option_c: questionType === "mcq" ? optionC.trim() || null : null,
        option_d: questionType === "mcq" ? optionD.trim() || null : null,
        correct_answer:
          questionType === "written" ? null : correctAnswer || "A",
        marks: Number(marks) || 1,
        question_order: Number(questionOrder) || 1,
        question_image_url,
        option_a_image_url: questionType === "written" ? null : option_a_image_url,
        option_b_image_url: questionType === "written" ? null : option_b_image_url,
        option_c_image_url: questionType === "mcq" ? option_c_image_url : null,
        option_d_image_url: questionType === "mcq" ? option_d_image_url : null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("exam_questions")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("exam_questions").insert(payload);
        if (error) throw error;
      }

      await syncExamTotals();
      await loadQuestions();
      resetForm();
      alert(editingId ? "تم تعديل السؤال" : "تم إضافة السؤال");
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "فشل الحفظ");
    } finally {
      setSaving(false);
      setUploadingField(null);
    }
  }

  function startEditQuestion(q: ExamQuestion) {
    setEditingId(q.id);
    const qType = q.question_type || "mcq";
    setQuestionType(qType);
    setQuestionText(q.question || "");
    setQuestionImage(q.question_image_url || null);
    setQuestionImageFile(null);
    setOptionA(q.option_a || "");
    setOptionAImage(q.option_a_image_url || null);
    setOptionAFile(null);
    setOptionB(q.option_b || "");
    setOptionBImage(q.option_b_image_url || null);
    setOptionBFile(null);
    setOptionC(q.option_c || "");
    setOptionCImage(q.option_c_image_url || null);
    setOptionCFile(null);
    setOptionD(q.option_d || "");
    setOptionDImage(q.option_d_image_url || null);
    setOptionDFile(null);
    setCorrectAnswer(q.correct_answer || (qType === "written" ? "" : "A"));
    setMarks(Number(q.marks) || 1);
    setQuestionOrder(Number(q.question_order) || 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteQuestion(id: string) {
    if (!confirm("حذف السؤال؟")) return;

    const { error } = await supabase
      .from("exam_questions")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await syncExamTotals();
    loadQuestions();
  }

  return (
    <main className="min-h-screen bg-slate-950 pb-16 pt-8 text-slate-100" dir="rtl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push("/admin/exams")}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800"
          >
            <ArrowRight className="h-4 w-4" />
            رجوع للامتحانات
          </button>
        </div>

        {/* Form */}
        <section className="mb-10 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-white">
              {editingId ? "تعديل سؤال" : "إضافة سؤال"}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              الحفظ يتم مباشرة في قاعدة البيانات
            </p>
          </div>

          <div className="space-y-6">
            {/* Question Type Selection */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                نوع السؤال
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "mcq", label: "اختيار من متعدد" },
                  { value: "true_false", label: "صح / خطأ" },
                  { value: "written", label: "مقالي" },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setQuestionType(t.value as any);
                      if (t.value === "true_false") {
                        setOptionA("صح");
                        setOptionB("خطأ");
                        setOptionC("");
                        setOptionD("");
                        setCorrectAnswer("A");
                      }
                      if (t.value === "written") {
                        setOptionA("");
                        setOptionB("");
                        setOptionC("");
                        setOptionD("");
                        setCorrectAnswer("");
                      }
                    }}
                    className={`rounded-xl border p-3 text-sm font-bold transition-all ${
                      questionType === t.value
                        ? "border-cyan-500 bg-cyan-500/15 text-cyan-300"
                        : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                نص السؤال
              </label>
              <textarea
                className="min-h-[120px] w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
              <ImageUploader
                label="صورة السؤال"
                imageUrl={questionImage}
                uploading={uploadingField === "question"}
                inputRef={questionFileRef}
                onSelect={(e) => handleFileChange(e, "question")}
                onRemove={() => removeImage("question")}
              />
            </div>

            {/* Options based on type */}
            {questionType === "mcq" && (
              <div className="grid gap-4 md:grid-cols-2">
                <OptionInput
                  label="A"
                  value={optionA}
                  onChange={setOptionA}
                  active={correctAnswer === "A"}
                  imageUrl={optionAImage}
                  uploading={uploadingField === "optionA"}
                  inputRef={optionAFileRef}
                  onSelect={(e) => handleFileChange(e, "optionA")}
                  onRemove={() => removeImage("optionA")}
                />
                <OptionInput
                  label="B"
                  value={optionB}
                  onChange={setOptionB}
                  active={correctAnswer === "B"}
                  imageUrl={optionBImage}
                  uploading={uploadingField === "optionB"}
                  inputRef={optionBFileRef}
                  onSelect={(e) => handleFileChange(e, "optionB")}
                  onRemove={() => removeImage("optionB")}
                />
                <OptionInput
                  label="C"
                  value={optionC}
                  onChange={setOptionC}
                  active={correctAnswer === "C"}
                  imageUrl={optionCImage}
                  uploading={uploadingField === "optionC"}
                  inputRef={optionCFileRef}
                  onSelect={(e) => handleFileChange(e, "optionC")}
                  onRemove={() => removeImage("optionC")}
                />
                <OptionInput
                  label="D"
                  value={optionD}
                  onChange={setOptionD}
                  active={correctAnswer === "D"}
                  imageUrl={optionDImage}
                  uploading={uploadingField === "optionD"}
                  inputRef={optionDFileRef}
                  onSelect={(e) => handleFileChange(e, "optionD")}
                  onRemove={() => removeImage("optionD")}
                />
              </div>
            )}

            {questionType === "true_false" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <span className="font-bold text-white">أ (صح)</span>
                  <span className="rounded-lg bg-cyan-950 px-3 py-1 text-xs font-bold text-cyan-300">افتراضي</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <span className="font-bold text-white">ب (خطأ)</span>
                  <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-bold text-slate-400">افتراضي</span>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {questionType !== "written" && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    الإجابة الصحيحة
                  </label>
                  <select
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                  >
                    <option value="A">A {questionType === "true_false" ? "(صح)" : ""}</option>
                    <option value="B">B {questionType === "true_false" ? "(خطأ)" : ""}</option>
                    {questionType === "mcq" && (
                      <>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </>
                    )}
                  </select>
                </div>
              )}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  الدرجة
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  الترتيب
                </label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-500"
                  value={questionOrder}
                  onChange={(e) => setQuestionOrder(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={addQuestion}
                disabled={saving}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-cyan-600 font-bold text-white hover:bg-cyan-500 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : editingId ? (
                  <>
                    <Pencil className="h-4 w-4" />
                    حفظ التعديل
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    إضافة السؤال
                  </>
                )}
              </button>

              {editingId && (
                <button
                  onClick={resetForm}
                  className="h-12 rounded-2xl border border-slate-700 bg-slate-900 px-6 font-bold text-slate-300 hover:bg-slate-800"
                >
                  إلغاء
                </button>
              )}
            </div>
          </div>
        </section>

        {/* List */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-black text-white">أسئلة الامتحان</h2>
            <div className="rounded-xl border border-cyan-800/50 bg-cyan-950/60 px-4 py-2 text-sm font-black text-cyan-400">
              {questions.length} سؤال
            </div>
          </div>

          {loading ? (
            <p className="text-center text-slate-400">جاري التحميل...</p>
          ) : questions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 p-14 text-center">
              <CircleHelp className="mx-auto mb-4 h-12 w-12 text-slate-600" />
              <h3 className="font-black text-slate-300">لا توجد أسئلة</h3>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="font-bold text-white">
                      {q.question_order}. {q.question}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditQuestion(q)}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        className="rounded-xl border border-red-900/50 bg-red-950/50 px-3 py-2 text-sm text-red-400 hover:bg-red-900/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    النوع: {q.question_type === 'true_false' ? 'صح/خطأ' : q.question_type === 'written' ? 'مقالي' : 'اختيار من متعدد'} • الدرجة: {q.marks} {q.correct_answer ? `• الصحيحة: ${q.correct_answer}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ImageUploader({
  label,
  imageUrl,
  uploading,
  inputRef,
  onSelect,
  onRemove,
}: {
  label: string;
  imageUrl: string | null;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onSelect}
      />
      {!imageUrl ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-400 hover:border-slate-500 hover:text-slate-300"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {label}
        </button>
      ) : (
        <div className="relative mt-2 w-fit rounded-2xl border border-slate-800 p-2">
          <img src={imageUrl} alt={label} className="max-h-40 rounded-xl object-contain" />
          <button
            type="button"
            onClick={onRemove}
            className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function OptionInput({
  label,
  value,
  onChange,
  active,
  imageUrl,
  uploading,
  inputRef,
  onSelect,
  onRemove,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  active: boolean;
  imageUrl: string | null;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
      <div className="relative">
        <div
          className={`absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-xs font-black ${
            active ? "bg-cyan-950 text-cyan-300" : "bg-slate-800 text-slate-400"
          }`}
        >
          {label}
        </div>
        <input
          className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 pl-14 pr-4 text-sm text-white outline-none focus:border-cyan-500"
          placeholder={`الاختيار ${label}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <ImageUploader
        label={`صورة ${label}`}
        imageUrl={imageUrl}
        uploading={uploading}
        inputRef={inputRef}
        onSelect={onSelect}
        onRemove={onRemove}
      />
    </div>
  );
}