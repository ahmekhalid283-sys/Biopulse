"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Upload, 
  X, 
  Loader2, 
  CheckCircle2, 
  CircleHelp 
} from "lucide-react";

// مكوّن الـ Button المعدل للوضع المظلم
const Button = ({ children, className, variant, ...props }: any) => {
  return (
    <button
      className={`inline-flex items-center justify-center font-bold transition ${
        variant === "outline"
          ? "border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default function ExamBuilder() {
  // States للأسئلة والبيانات
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form States
  const [questionText, setQuestionText] = useState("");
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  
  const [optionA, setOptionA] = useState("");
  const [optionAImage, setOptionAImage] = useState<string | null>(null);
  
  const [optionB, setOptionB] = useState("");
  const [optionBImage, setOptionBImage] = useState<string | null>(null);
  
  const [optionC, setOptionC] = useState("");
  const [optionCImage, setOptionCImage] = useState<string | null>(null);
  
  const [optionD, setOptionD] = useState("");
  const [optionDImage, setOptionDImage] = useState<string | null>(null);
  
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [marks, setMarks] = useState<number>(1);
  const [questionOrder, setQuestionOrder] = useState<number>(1);
  const [explanation, setExplanation] = useState("");

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // File Refs
  const questionFileRef = useRef<HTMLInputElement | null>(null);
  const optionAFileRef = useRef<HTMLInputElement | null>(null);
  const optionBFileRef = useRef<HTMLInputElement | null>(null);
  const optionCFileRef = useRef<HTMLInputElement | null>(null);
  const optionDFileRef = useRef<HTMLInputElement | null>(null);

  // محاكاة رفع الصور
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);
    
    setTimeout(() => {
      const fakeUrl = URL.createObjectURL(file);
      if (field === "question") setQuestionImage(fakeUrl);
      if (field === "optionA") setOptionAImage(fakeUrl);
      if (field === "optionB") setOptionBImage(fakeUrl);
      if (field === "optionC") setOptionCImage(fakeUrl);
      if (field === "optionD") setOptionDImage(fakeUrl);
      
      setUploadingField(null);
    }, 1000);
  };

  const removeImage = (field: string) => {
    if (field === "question") setQuestionImage(null);
    if (field === "optionA") setOptionAImage(null);
    if (field === "optionB") setOptionBImage(null);
    if (field === "optionC") setOptionCImage(null);
    if (field === "optionD") setOptionDImage(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setQuestionText("");
    setQuestionImage(null);
    setOptionA("");
    setOptionAImage(null);
    setOptionB("");
    setOptionBImage(null);
    setOptionC("");
    setOptionCImage(null);
    setOptionD("");
    setOptionDImage(null);
    setCorrectAnswer("A");
    setMarks(1);
    setQuestionOrder(questions.length + 1);
    setExplanation("");
  };

  const addQuestion = () => {
    setSaving(true);
    setTimeout(() => {
      const newQ = {
        id: editingId || Date.now().toString(),
        question: questionText,
        question_image_url: questionImage,
        option_a: optionA,
        option_a_image_url: optionAImage,
        option_b: optionB,
        option_b_image_url: optionBImage,
        option_c: optionC,
        option_c_image_url: optionCImage,
        option_d: optionD,
        option_d_image_url: optionDImage,
        correct_answer: correctAnswer,
        marks: marks,
        question_order: questionOrder,
        explanation: explanation,
      };

      if (editingId) {
        setQuestions(questions.map((q) => (q.id === editingId ? newQ : q)));
      } else {
        setQuestions([...questions, newQ]);
      }

      setSaving(false);
      resetForm();
    }, 800);
  };

  const startEditQuestion = (q: any) => {
    setEditingId(q.id);
    setQuestionText(q.question || "");
    setQuestionImage(q.question_image_url || null);
    setOptionA(q.option_a || "");
    setOptionAImage(q.option_a_image_url || null);
    setOptionB(q.option_b || "");
    setOptionBImage(q.option_b_image_url || null);
    setOptionC(q.option_c || "");
    setOptionCImage(q.option_c_image_url || null);
    setOptionD(q.option_d || "");
    setOptionDImage(q.option_d_image_url || null);
    setCorrectAnswer(q.correct_answer || "A");
    setMarks(q.marks || 1);
    setQuestionOrder(q.question_order || 1);
    setExplanation(q.explanation || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  return (
    <main className="min-h-screen bg-slate-950 pb-16 pt-8 text-slate-100" dir="rtl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        
        {/* ================================================= */}
        {/* Form Section */}
        {/* ================================================= */}
        <section className="mb-10 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-white">
              إضافة / تعديل سؤال
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              قم بتعبئة بيانات السؤال والخيارات بعناية.
            </p>
          </div>

          <div className="space-y-6">
            
            {/* Question Text & Image */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                نص السؤال
              </label>
              <textarea
                className="min-h-[120px] w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/10"
                placeholder="اكتب نص السؤال هنا..."
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
              />
              <ImageUploader
                label="إضافة صورة للسؤال"
                imageUrl={questionImage}
                uploading={uploadingField === "question"}
                inputRef={questionFileRef}
                onSelect={(e) => handleFileChange(e, "question")}
                onRemove={() => removeImage("question")}
              />
            </div>

            {/* Options Grid */}
            <div>
              <label className="mb-3 block text-sm font-bold text-slate-300">
                خيارات الإجابة
              </label>
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
            </div>

            {/* Settings */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  الإجابة الصحيحة
                </label>
                <select
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/10"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                >
                  <option value="A" className="bg-slate-900">A</option>
                  <option value="B" className="bg-slate-900">B</option>
                  <option value="C" className="bg-slate-900">C</option>
                  <option value="D" className="bg-slate-900">D</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  درجة السؤال
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/10"
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  ترتيب السؤال
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-500 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/10"
                  value={questionOrder}
                  onChange={(e) => setQuestionOrder(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-300">
                شرح الإجابة
                <span className="mr-2 text-xs font-normal text-slate-500">
                  اختياري
                </span>
              </label>
              <textarea
                className="min-h-[100px] w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/10"
                placeholder="اكتب شرح الإجابة إذا أردت..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={addQuestion}
                disabled={saving || uploadingField !== null}
                className="h-12 flex-1 rounded-2xl bg-cyan-600 text-white shadow-lg transition hover:bg-cyan-500 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جارٍ الحفظ...
                  </>
                ) : editingId ? (
                  <>
                    <Pencil className="ml-2 h-4 w-4" />
                    حفظ التعديل
                  </>
                ) : (
                  <>
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة السؤال
                  </>
                )}
              </Button>

              {editingId && (
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="h-12 rounded-2xl px-6"
                >
                  إلغاء التعديل
                </Button>
              )}
            </div>

          </div>
        </section>

        {/* ================================================= */}
        {/* Questions List */}
        {/* ================================================= */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">
                أسئلة الامتحان
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                مراجعة وإدارة جميع الأسئلة الموجودة.
              </p>
            </div>
            <div className="rounded-xl bg-cyan-950/60 border border-cyan-800/50 px-4 py-2 text-sm font-black text-cyan-400">
              {questions.length} سؤال
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-12 text-center text-slate-400 shadow-xl">
              جارٍ تحميل الأسئلة...
            </div>
          ) : questions.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 p-14 text-center shadow-xl">
              <CircleHelp className="mx-auto mb-4 h-12 w-12 text-slate-600" />
              <h3 className="font-black text-slate-300">
                لا توجد أسئلة حتى الآن
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                ابدأ بإضافة أول سؤال للامتحان.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl transition hover:border-slate-700"
                >
                  {/* Header */}
                  <div className="flex flex-col gap-4 border-b border-slate-800 bg-slate-900/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-800 font-black text-cyan-300">
                        {q.question_order}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400">
                          سؤال رقم {q.question_order}
                        </span>
                        <p className="text-xs text-slate-500">
                          الدرجة: {q.marks}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditQuestion(q)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-cyan-500 hover:text-cyan-400"
                      >
                        <Pencil className="h-4 w-4" />
                        تعديل
                      </button>

                      <button
                        onClick={() => deleteQuestion(q.id)}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-950/50 border border-red-900/50 px-4 py-2 text-sm font-bold text-red-400 transition hover:bg-red-900/50"
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 sm:p-6">
                    <div className="space-y-4">
                      {q.question && (
                        <h3 className="text-lg font-black leading-8 text-white">
                          {q.question}
                        </h3>
                      )}
                      {q.question_image_url && (
                        <ImagePreview
                          src={q.question_image_url}
                          alt="صورة السؤال"
                        />
                      )}
                    </div>

                    {/* Options */}
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      <AnswerOption
                        letter="A"
                        text={q.option_a}
                        imageUrl={q.option_a_image_url}
                        correct={q.correct_answer === "A"}
                      />
                      <AnswerOption
                        letter="B"
                        text={q.option_b}
                        imageUrl={q.option_b_image_url}
                        correct={q.correct_answer === "B"}
                      />
                      <AnswerOption
                        letter="C"
                        text={q.option_c}
                        imageUrl={q.option_c_image_url}
                        correct={q.correct_answer === "C"}
                      />
                      <AnswerOption
                        letter="D"
                        text={q.option_d}
                        imageUrl={q.option_d_image_url}
                        correct={q.correct_answer === "D"}
                      />
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-950/60 border border-emerald-900/50 px-4 py-3 text-sm font-bold text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        الإجابة الصحيحة: {q.correct_answer}
                      </div>
                      <div className="rounded-xl bg-cyan-950/60 border border-cyan-900/50 px-4 py-3 text-sm font-bold text-cyan-400">
                        الدرجة: {q.marks}
                      </div>
                    </div>

                    {q.explanation && (
                      <div className="mt-5 rounded-2xl border border-blue-900/50 bg-blue-950/30 p-4">
                        <p className="mb-1 text-xs font-black text-blue-400">
                          شرح الإجابة
                        </p>
                        <p className="text-sm leading-7 text-blue-200">
                          {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

/*
 * =========================================================
 * Image uploader
 * =========================================================
 */
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
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-400 transition hover:border-cyan-500 hover:bg-cyan-950/30 hover:text-cyan-400 disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "جاري رفع الصورة..." : label}
        </button>
      ) : (
        <div className="relative mt-2 w-fit overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-2 shadow-xl">
          <img
            src={imageUrl}
            alt={label}
            className="max-h-48 max-w-full rounded-xl object-contain"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-500"
            aria-label="حذف الصورة"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/*
 * =========================================================
 * Option input
 * =========================================================
 */
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
  onChange: (value: string) => void;
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
            active
              ? "bg-cyan-950 border border-cyan-800 text-cyan-300"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          {label}
        </div>
        <input
          className="w-full rounded-2xl border border-slate-800 bg-slate-900 py-3 pl-14 pr-4 text-sm text-white outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10"
          placeholder={`الاختيار ${label}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <ImageUploader
        label={`إضافة صورة للاختيار ${label}`}
        imageUrl={imageUrl}
        uploading={uploading}
        inputRef={inputRef}
        onSelect={onSelect}
        onRemove={onRemove}
      />
    </div>
  );
}

/*
 * =========================================================
 * Image preview
 * =========================================================
 */
function ImagePreview({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-2">
      <img
        src={src}
        alt={alt}
        className="max-h-[400px] w-auto max-w-full rounded-xl object-contain"
      />
    </div>
  );
}

/*
 * =========================================================
 * Answer option
 * =========================================================
 */
function AnswerOption({
  letter,
  text,
  imageUrl,
  correct,
}: {
  letter: string;
  text: string;
  imageUrl: string | null;
  correct: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        correct
          ? "border-emerald-900/60 bg-emerald-950/30"
          : "border-slate-800 bg-slate-950/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
            correct
              ? "bg-emerald-600 text-white"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          {letter}
        </div>
        <div className="min-w-0 flex-1">
          {text && (
            <p
              className={`pt-1 text-sm leading-6 ${
                correct
                  ? "font-bold text-emerald-300"
                  : "text-slate-300"
              }`}
            >
              {text}
            </p>
          )}
          {imageUrl && (
            <img
              src={imageUrl}
              alt={`الاختيار ${letter}`}
              className="mt-3 max-h-64 max-w-full rounded-xl object-contain"
            />
          )}
        </div>
        {correct && (
          <CheckCircle2 className="mr-auto mt-1 h-4 w-4 shrink-0 text-emerald-400" />
        )}
      </div>
    </div>
  );
}