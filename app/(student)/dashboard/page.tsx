"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CountUp from "react-countup";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/student/layout/Sidebar";
import ChapterCard from "@/components/student/ChapterCard";
import FadeIn from "@/components/FadeIn";
import { motion } from "framer-motion";
import NotificationBell from "@/components/notifications/NotificationBell";
import {
  Sparkles,
  Trophy,
  BookOpen,
  ArrowRight,
  Activity,
  Target
} from "lucide-react";

// Types
type Chapter = {
  id: string;
  title: string;
  teacher: string;
  slug: string;
  lectures_count: number;
};

type Student = {
  id: string;
  auth_id: string;
  full_name: string;
  avatar_url?: string;
  rank: number;
};

type TopStudent = {
  id: string;
  full_name: string;
  average_score: number;
  total_exams: number;
  rank: number;
};

type RecentExam = {
  id: string;
  score: number | null;
  total: number;
  percentage: number;
  created_at: string;
  exams: { title: string }[] | { title: string } | null;
};

const CHAPTER_IMAGES = [
  "/images/chapters/support.png",
  "/images/chapters/hormones.png",
  "/images/chapters/reproduction.png",
  "/images/chapters/immunity.png",
  "/images/chapters/dna.png",
];

const CHAPTER_COLORS = [
  "border-cyan-500/40 hover:border-cyan-400",
  "border-purple-500/40 hover:border-purple-400",
  "border-pink-500/40 hover:border-pink-400",
  "border-emerald-500/40 hover:border-emerald-400",
  "border-blue-500/40 hover:border-blue-400",
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function DashboardPage() {
  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [recentExams, setRecentExams] = useState<RecentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalExams: 0,
    average: 0,
  });

  const loadStats = async (studentId: string) => {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select("percentage")
      .eq("student_id", studentId);

    if (error) {
      console.error("loadStats error:", error);
      return;
    }

    const total = data?.length ?? 0;
    const avg =
      total === 0
        ? 0
        : data.reduce(
            (sum, exam) => sum + (Number(exam.percentage) || 0),
            0
          ) / total;

    setStats({
      totalExams: total,
      average: Number(avg.toFixed(1)),
    });
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.replace("/auth");
        return;
      }

      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (studentError || !studentData) {
        router.replace("/auth");
        return;
      }

      setStudent(studentData);
      await loadStats(studentData.id);

      const [
        chaptersRes,
        studentsRes,
        attemptsRes,
      ] = await Promise.all([
        supabase
          .from("chapters")
          .select("*")
          .order("display_order"),
        (async () => {
          const { data: studentsData, error: studentsError } = await supabase
            .from("students")
            .select("id, full_name");

          if (studentsError) throw studentsError;

          const studentIds = (studentsData ?? []).map((s) => s.id);

          const { data: attemptsData, error: attemptsError } = await supabase
            .from("exam_attempts")
            .select("student_id, percentage")
            .in("student_id", studentIds);

          if (attemptsError) throw attemptsError;

          const leaderboard = (studentsData ?? [])
            .map((s) => {
              const studentAttempts = (attemptsData ?? []).filter(
                (attempt) => attempt.student_id === s.id
              );
              const totalExams = studentAttempts.length;
              const averageScore =
                totalExams === 0
                  ? 0
                  : studentAttempts.reduce(
                      (sum, attempt) =>
                        sum + (Number(attempt.percentage) || 0),
                      0
                    ) / totalExams;

              return {
                id: s.id,
                full_name: s.full_name,
                average_score: Number(averageScore.toFixed(1)),
                total_exams: totalExams,
                rank: 0,
              };
            })
            .filter((s) => s.total_exams > 0)
            .sort((a, b) => b.average_score - a.average_score)
            .map((s, index) => ({
              ...s,
              rank: index + 1,
            }));

          setTopStudents(leaderboard.slice(0, 10));
          return { data: leaderboard };
        })(),
        supabase
          .from("exam_attempts")
          .select(`
            id,
            score,
            total,
            percentage,
            created_at,
            exams (
              title
            )
          `)
          .eq("student_id", studentData.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      if (chaptersRes.error) throw chaptersRes.error;

      const myAttempts = attemptsRes.data ?? [];
      const latestAttempt =
        myAttempts.length > 0
          ? myAttempts[0]
          : null;

      if (latestAttempt) {
        setRecentExams([
          {
            id: latestAttempt.id,
            score: latestAttempt.score,
            total: latestAttempt.total,
            percentage: Number(latestAttempt.percentage) || 0,
            created_at: latestAttempt.created_at,
            exams: latestAttempt.exams ?? null,
          },
        ]);
      } else {
        setRecentExams([]);
      }

      const chaptersWithCount = await Promise.all(
        (chaptersRes.data ?? []).map(async (chapter) => {
          const { count, error: lecturesError } = await supabase
            .from("lectures")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("chapter_id", chapter.id)
            .eq("is_published", true);

          if (lecturesError) {
            console.error(
              `Lectures count error for chapter ${chapter.id}:`,
              lecturesError
            );
          }

          return {
            ...chapter,
            lectures_count: count ?? 0,
          };
        })
      );

      setChapters(chaptersWithCount);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("تعذر مزامنة البيانات، يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <Sparkles className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">جاري تحميل بيئة العمل...</p>
        </div>
      </div>
    );
  }

  if (!student) return null;

  const progress = Math.min(stats.average, 100);
  const displayRank =
    topStudents.find(
      (s) => s.id === student.id
    )?.rank ?? 0;

  return (
    <div
      dir="rtl"
      className="relative min-h-screen flex bg-[#020617] text-slate-100 overflow-hidden font-sans selection:bg-cyan-500 selection:text-slate-950"
    >
      {/* Background Architectural Glows */}
      <div className="absolute top-0 right-1/3 -z-10 w-[500px] h-[500px] bg-cyan-500/[0.07] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-10 -z-10 w-[500px] h-[500px] bg-indigo-500/[0.07] rounded-full blur-[120px] pointer-events-none" />

      {/* الـ Sidebar ثابت على اليمين */}
      <Sidebar studentName={student.full_name} avatarUrl={student.avatar_url} />

      {/* تم تغيير الهامش هنا إلى lg:mr-72 لكي يترك مساحة من اليمين للسايدبار ولا يتداخل معه */}
      <div className="flex-1 flex flex-col lg:mr-72">
        <main className="flex-1 p-6 lg:p-10">
          <div className="mx-auto max-w-7xl space-y-8">
           
            {/* Error Notification Banner */}
            {error && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-rose-400 flex items-center justify-between backdrop-blur-xl">
                <span className="text-sm font-medium">{error}</span>
                <button
                  onClick={() => fetchData()}
                  className="px-4 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-semibold hover:bg-rose-600 transition shadow-lg shadow-rose-500/20"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            {/* Dashboard Header */}
            <FadeIn
              delay={0.05}
              className="relative overflow-visible rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-cyan-950/20 p-6 lg:p-7 backdrop-blur-2xl shadow-xl z-50">
              <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Activity className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">
                      مرحباً بعودتك 👋
                    </p>
                    <h2 className="text-xl font-black text-white">
                      {student.full_name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      استمر في التعلم وحقق هدفك الأكاديمي
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <NotificationBell />
                  <Link
                    href="/profile"
                    className="group flex items-center gap-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 px-5 py-3 text-sm font-bold text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-all duration-300"
                  >
                    <span>الملف الشخصي</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
                  </Link>
                </div>
              </div>
              <div className="relative mt-6 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            </FadeIn>

            {/* Hero Main Overview Grid */}
            <div className="grid lg:grid-cols-1 gap-6">
              <FadeIn className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-cyan-950/20 border border-cyan-500/20 p-8 backdrop-blur-2xl shadow-2xl">
                <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-pink-500" />
               
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-4 bg-cyan-500/10 border border-cyan-500/20 px-3.5 py-1.5 rounded-full w-fit">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>الصفحة الرئيسية</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  طريقك نحو <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300"> التفوق</span>
                </h1>
                <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                  تابع تقدمك المستمر، انجز الامتحانات الدورية، وراقب صعودك تدريجياً نحو قمة لوحة الشرف.
                </p>
                <div className="mt-6 flex flex-wrap gap-3.5">
                  <Link href="/chapters">
                    <button className="flex items-center gap-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-6 py-3.5 font-bold text-sm transition shadow-xl shadow-cyan-500/20">
                      <span>استعراض الفصول</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                  <Link href="/results">
                    <button className="rounded-2xl border border-slate-700/80 hover:border-cyan-500/40 bg-slate-800/40 text-slate-300 hover:text-cyan-400 px-6 py-3.5 font-semibold text-sm transition backdrop-blur-md">
                      سجل النتائج
                    </button>
                  </Link>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-800/80">
                  <div className="flex justify-between items-center mb-2.5 text-xs font-semibold">
                    <span className="text-slate-400">معدل الإنجاز الكلي</span>
                    <span className="text-cyan-400 font-bold">
                      <CountUp end={progress} decimals={1} duration={2} />%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden p-0.5 border border-slate-700/30">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-700 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </FadeIn>
            </div>

            {/* Chapters Section */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                  <BookOpen className="w-5 h-5 text-cyan-400" />
                  <span>المناهج والفصول الدراسية</span>
                </h2>
                <Link href="/chapters" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition">
                  عرض الكل ←
                </Link>
              </div>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid lg:grid-cols-5 gap-4"
              >
                {chapters.map((chapter, index) => (
                  <motion.div key={chapter.id} variants={itemVariants}>
                    <ChapterCard
                      title={chapter.title}
                      teacher={chapter.teacher}
                      lectures={chapter.lectures_count}
                      image={CHAPTER_IMAGES[index] ?? "/images/chapters/default.png"}
                      color={CHAPTER_COLORS[index % CHAPTER_COLORS.length]}
                      href={`/chapters/${chapter.slug}`}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Analytics & Leaderboard Grid */}
            <div className="grid lg:grid-cols-2 gap-6">
             
              {/* Top Students / Leaderboard */}
              <FadeIn delay={0.2} direction="right" className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 backdrop-blur-2xl shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <span>لوحة الشرف (أفضل 10 طلاب)</span>
                  </h2>
                  <span className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/50">التصنيف العام</span>
                </div>
                {topStudents.length === 0 ? (
                  <p className="text-slate-400 text-center py-8 text-sm">لا توجد بيانات متاحة حتى الآن.</p>
                ) : (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pl-1">
                    {topStudents.map((topStudent, index) => {
                      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
                      return (
                        <div
                          key={`${topStudent.id}-${index}`}
                          className="flex items-center justify-between rounded-2xl bg-slate-800/35 hover:bg-slate-800/70 border border-slate-700/30 p-3.5 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold w-8 text-center">{medal}</span>
                            <div>
                              <h4 className="font-semibold text-white">{topStudent.full_name}</h4>
                              <p className="text-xs text-slate-400">
                                الامتحانات: {topStudent.total_exams}
                              </p>
                            </div>
                          </div>
                          <div className="text-left">
                            <span className="font-bold text-emerald-400">{topStudent.average_score}</span>
                            <span className="text-xs text-slate-400 block">المتوسط</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </FadeIn>

              {/* Latest Performance Card */}
              <FadeIn
                delay={0.2}
                direction="left"
                className="rounded-3xl bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-indigo-950/20 border border-indigo-500/20 p-6 backdrop-blur-2xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                      <Activity className="w-5 h-5 text-indigo-400" />
                      <span>أداؤك الأخير</span>
                    </h2>
                    <span className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                      آخر نتيجة
                    </span>
                  </div>
                  {recentExams.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                        <BookOpen className="w-6 h-6 text-indigo-400" />
                      </div>
                      <p className="text-slate-400 text-sm">
                        لم تخض أي امتحان حتى الآن
                      </p>
                      <Link
                        href="/chapters"
                        className="inline-flex mt-4 items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold hover:bg-indigo-500/20 transition"
                      >
                        ابدأ أول امتحان
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  ) : (
                    (() => {
                      const latestExam = recentExams[0];
                      return (
                        <div className="space-y-5">
                          <div className="rounded-2xl bg-slate-800/30 border border-slate-700/30 p-4">
                            <p className="text-xs text-slate-400 mb-2">
                              آخر امتحان
                            </p>
                            <h3 className="font-bold text-slate-200 text-sm">
                              {Array.isArray(latestExam.exams)
                                ? latestExam.exams[0]?.title ?? "بدون اسم"
                                : latestExam.exams?.title ?? "بدون اسم"}
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-cyan-500/5 border border-cyan-500/10 p-4">
                              <p className="text-xs text-slate-400 mb-2">
                                الدرجة
                              </p>
                              <p className="text-2xl font-black text-cyan-400">
                                {latestExam.score}
                                <span className="text-sm text-slate-500">
                                  {" "}
                                  / {latestExam.total}
                                </span>
                              </p>
                            </div>
                            <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-4">
                              <p className="text-xs text-slate-400 mb-2">
                                النسبة
                              </p>
                              <p className="text-2xl font-black text-emerald-400">
                                <CountUp
                                  end={Number(latestExam.percentage ?? 0)}
                                  decimals={1}
                                  duration={1.5}
                                />
                                %
                              </p>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-slate-400">
                                مستوى الأداء
                              </span>
                              <span className="text-indigo-400 font-bold">
                                {Number(latestExam.percentage ?? 0) >= 80
                                  ? "ممتاز"
                                  : Number(latestExam.percentage ?? 0) >= 60
                                  ? "جيد"
                                  : "يحتاج تحسين"}
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-700"
                                style={{
                                  width: `${Math.min(
                                    Number(latestExam.percentage ?? 0),
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80">
                  <Link
                    href="/results"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800/50 hover:bg-indigo-500/10 border border-slate-700/50 hover:border-indigo-500/30 py-3 text-sm font-bold text-slate-300 hover:text-indigo-300 transition"
                  >
                    عرض سجل النتائج
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </FadeIn>
            </div>

            {/* Progress Center */}
            <FadeIn
              delay={0.3}
              className="rounded-3xl bg-gradient-to-br from-slate-900/70 via-slate-900/50 to-cyan-950/20 border border-cyan-500/20 p-6 lg:p-8 backdrop-blur-2xl shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-xl font-bold text-white">
                      مركز التقدم
                    </h2>
                  </div>
                  <p className="text-sm text-slate-400">
                    تابع مستواك وحدد خطوتك القادمة في رحلة BioPulse.
                  </p>
                </div>
                <Link
                  href="/chapters"
                  className="flex items-center gap-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-4 py-2.5 text-sm font-semibold text-cyan-400 hover:bg-cyan-500/20 transition"
                >
                  ابدأ التعلم
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
               
                {/* Progress */}
                <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-400">
                      مستوى الإنجاز
                    </span>
                    <Target className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black text-cyan-400">
                      <CountUp
                        end={progress}
                        decimals={1}
                        duration={2}
                      />
                    </span>
                    <span className="text-slate-500 mb-1">
                      %
                    </span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-slate-700/70 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Exams */}
                <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-400">
                      الامتحانات المنجزة
                    </span>
                    <BookOpen className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-3xl font-black text-purple-400">
                    <CountUp
                      end={stats.totalExams}
                      duration={2}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    استمر في التدريب لرفع مستواك
                  </p>
                </div>

                {/* Rank */}
                <div className="rounded-2xl bg-slate-800/30 border border-slate-700/40 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-slate-400">
                      ترتيبك الحالي
                    </span>
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-3xl font-black text-amber-400">
                    #{displayRank}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    نافس للوصول إلى المراكز الأولى
                  </p>
                </div>
              </div>
            </FadeIn>
          </div>
        </main>

        <footer className="py-6 text-center text-slate-500 text-xs border-t border-slate-800/80 mt-12 bg-slate-950/40">
          BioPulse Learning Platform © 2027 - جميع الحقوق محفوظة
        </footer>
      </div>
    </div>
  );
}