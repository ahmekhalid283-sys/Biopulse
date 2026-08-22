"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  BookOpen,
  GraduationCap,
  Hash,
  Plus,
  Search,
  Users,
  X,
  Trash2,
} from "lucide-react";

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
  const [loadingChapters, setLoadingChapters] = useState(true);

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  async function loadChapters() {
    try {
      setLoadingChapters(true);

      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .order("display_order", {
          ascending: true,
        });

      if (error) {
        alert(error.message);
        return;
      }

      setChapters(data || []);
    } finally {
      setLoadingChapters(false);
    }
  }

  useEffect(() => {
    loadChapters();
  }, []);

  async function handleSave() {
    if (!title.trim() || !teacher.trim() || !order) {
      alert("املأ جميع البيانات");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("chapters")
      .insert({
        title: title.trim(),
        teacher: teacher.trim(),
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

    setShowAdd(false);

    loadChapters();
  }

  async function handleDelete(id: string, title: string) {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الفصل "${title}"؟`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("chapters")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    setChapters((prev) =>
      prev.filter((chapter) => chapter.id !== id)
    );
  }

  const filteredChapters = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return chapters;

    return chapters.filter((chapter) => {
      return (
        chapter.title.toLowerCase().includes(value) ||
        chapter.teacher.toLowerCase().includes(value)
      );
    });
  }, [chapters, search]);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#07090e] text-slate-100"
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ================================================= */}
        {/* Header */}
        {/* ================================================= */}

        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-400">
              <span>الإدارة</span>
              <span>/</span>
              <span className="text-slate-200">الفصول</span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              الفصول الدراسية
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              إدارة وتنظيم الفصول والمحتوى العلمي داخل منصة BioPulse.
            </p>
          </div>

          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-950 transition hover:bg-blue-500 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            إضافة فصل
          </button>
        </div>

        {/* ================================================= */}
        {/* Stats */}
        {/* ================================================= */}

        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<BookOpen className="h-5 w-5" />}
            label="إجمالي الفصول"
            value={chapters.length}
          />

          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="المدرسون"
            value={
              new Set(
                chapters.map(
                  (chapter) => chapter.teacher
                )
              ).size
            }
          />

          <StatCard
            icon={<GraduationCap className="h-5 w-5" />}
            label="آخر ترتيب"
            value={
              chapters.length
                ? Math.max(
                    ...chapters.map(
                      (chapter) =>
                        chapter.display_order
                    )
                  )
                : 0
            }
          />
        </div>

        {/* ================================================= */}
        {/* Content Card */}
        {/* ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0d1322] shadow-xl">

          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-slate-800 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-black text-white">قائمة الفصول</h2>
              <p className="mt-1 text-xs text-slate-400">
                {chapters.length} فصل مسجل في المنصة
              </p>
            </div>

            <div className="relative w-full md:max-w-xs">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن فصل أو مدرس..."
                className="h-10 w-full rounded-xl border border-slate-800 bg-[#07090e] pr-10 pl-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-[#07090e] focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          {/* ================================================= */}
          {/* Desktop Table */}
          {/* ================================================= */}

          <div className="hidden md:block">
            <div className="grid grid-cols-[90px_1fr_260px] border-b border-slate-800 bg-[#07090e]/50 px-6 py-3 text-xs font-bold text-slate-400">
              <div>الترتيب</div>
              <div>الفصل</div>
              <div>المدرس</div>
            </div>

            {loadingChapters ? (
              <LoadingRows />
            ) : filteredChapters.length === 0 ? (
              <EmptyState
                hasSearch={!!search}
                onAdd={() => setShowAdd(true)}
              />
            ) : (
              filteredChapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className="group grid grid-cols-[90px_1fr_260px] items-center border-b border-slate-800/60 px-6 py-4 transition last:border-b-0 hover:bg-slate-800/30"
                >
                  {/* Number & Delete */}
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-slate-800 px-2 text-xs font-black text-slate-300 transition group-hover:bg-blue-600 group-hover:text-white">
                      #{chapter.display_order}
                    </span>

                    <button
                      onClick={() =>
                        handleDelete(
                          chapter.id,
                          chapter.title
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
                      title="حذف الفصل"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Chapter */}
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      <BookOpen className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">
                        {chapter.title}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        فصل دراسي #{index + 1}
                      </p>
                    </div>
                  </div>

                  {/* Teacher */}
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      <GraduationCap className="h-4 w-4" />
                    </div>

                    <span className="text-sm font-semibold text-slate-300">
                      {chapter.teacher}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ================================================= */}
          {/* Mobile Cards */}
          {/* ================================================= */}

          <div className="space-y-3 p-3 md:hidden">
            {loadingChapters ? (
              <LoadingMobile />
            ) : filteredChapters.length === 0 ? (
              <EmptyState
                hasSearch={!!search}
                onAdd={() => setShowAdd(true)}
              />
            ) : (
              filteredChapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="rounded-2xl border border-slate-800 bg-[#07090e] p-4 shadow-sm transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      <BookOpen className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate font-black text-white">
                            {chapter.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-400">
                            {chapter.teacher}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="shrink-0 rounded-lg bg-slate-800 px-2 py-1 text-[10px] font-black text-slate-300">
                            #{chapter.display_order}
                          </span>

                          <button
                            onClick={() =>
                              handleDelete(
                                chapter.id,
                                chapter.title
                              )
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
                            title="حذف الفصل"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 border-t border-slate-800 pt-3 text-xs text-slate-400">
                        <GraduationCap className="h-3.5 w-3.5 text-purple-400" />
                        <span>{chapter.teacher}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </section>

      </div>

      {/* ================================================= */}
      {/* Add Chapter Modal */}
      {/* ================================================= */}

      {showAdd && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowAdd(false);
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-[#0d1322] shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Plus className="h-5 w-5" />
                  </div>
                  <h2 className="font-black text-white">إضافة فصل جديد</h2>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  أضف البيانات الأساسية للفصل الدراسي.
                </p>
              </div>

              <button
                onClick={() => setShowAdd(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-5 p-6">
              <Field
                label="اسم الفصل"
                placeholder="مثال: Genetics"
                value={title}
                onChange={setTitle}
                icon={<BookOpen className="h-4 w-4" />}
              />

              <Field
                label="اسم المدرس"
                placeholder="مثال: د. أحمد محمد"
                value={teacher}
                onChange={setTeacher}
                icon={<GraduationCap className="h-4 w-4" />}
              />

              <Field
                label="ترتيب الفصل"
                placeholder="مثال: 1"
                value={order}
                onChange={setOrder}
                type="number"
                icon={<Hash className="h-4 w-4" />}
              />

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
                <button
                  onClick={() => setShowAdd(false)}
                  className="h-11 flex-1 rounded-xl border border-slate-800 bg-[#07090e] text-sm font-bold text-slate-300 transition hover:bg-slate-800"
                >
                  إلغاء
                </button>

                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="h-11 flex-1 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg shadow-blue-950"
                >
                  {loading ? "جارٍ الحفظ..." : "إضافة الفصل"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}

/* ========================================================= */
/* Components */
/* ========================================================= */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0d1322] p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          {icon}
        </div>
        <span className="text-xs font-medium text-slate-500">BioPulse</span>
      </div>

      <p className="mt-5 text-sm font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  icon,
  type = "text",
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: React.ReactNode;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-300">
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute right-3 top-1/2 flex -translate-y-1/2 items-center text-slate-400">
          {icon}
        </div>

        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full rounded-xl border border-slate-800 bg-[#07090e] pr-10 pl-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-[#07090e] focus:ring-4 focus:ring-blue-500/10"
        />
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-6">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-16 animate-pulse rounded-xl bg-slate-800/40"
        />
      ))}
    </div>
  );
}

function LoadingMobile() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-24 animate-pulse rounded-2xl bg-slate-800/40"
        />
      ))}
    </div>
  );
}

function EmptyState({
  hasSearch,
  onAdd,
}: {
  hasSearch: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
        <BookOpen className="h-6 w-6" />
      </div>

      <h3 className="font-black text-white">
        {hasSearch ? "لا توجد نتائج" : "لا توجد فصول حتى الآن"}
      </h3>

      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
        {hasSearch
          ? "جرب البحث باسم مختلف."
          : "ابدأ بإضافة أول فصل دراسي إلى المنصة."}
      </p>

      {!hasSearch && (
        <button
          onClick={onAdd}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 shadow-lg shadow-blue-950"
        >
          <Plus className="h-4 w-4" />
          إضافة فصل
        </button>
      )}
    </div>
  );
}