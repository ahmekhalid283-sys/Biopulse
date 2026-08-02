"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CountUp from "react-countup";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/student/layout/Sidebar";
import ChapterCard from "@/components/student/ChapterCard";
import FadeIn from "@/components/FadeIn";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

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
  average_score: number | null;
  points: number;
  streak: number;
  total_exams: number;
  rank: number;
};

type RecentExam = {
  id: string;
  score: number | null;
  total: number;
  percentage: number;
  created_at: string;
  exams: {
    title: string;
  } | null;
};

type TopStudent = {
  full_name: string;
  average_score: number | null;
  total_exams?: number;
  rank: number;
};

const images = [
  "/images/chapters/support.png",
  "/images/chapters/hormones.png",
  "/images/chapters/reproduction.png",
  "/images/chapters/immunity.png",
  "/images/chapters/dna.png",
];

const colors = [
  "border-cyan-500",
  "border-purple-500",
  "border-pink-500",
  "border-green-500",
  "border-blue-500",
];

const containerVariants = {
  hidden: {
    opacity: 0,
  },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

export default function DashboardPage() {
  console.count("Dashboard Render");
  useEffect(() => {
    console.log("Dashboard Mounted");
  }, []);

  const router = useRouter();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [recentExams, setRecentExams] = useState<RecentExam[]>([]);
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  console.log("Student state", student);
  console.log("Chapters state", chapters.length);
  console.log("Recent Exams", recentExams.length);
  console.log("Top Students", topStudents.length);

  const loadChapters = async () => {
    const { data: chaptersData, error } = await supabase
      .from("chapters")
      .select("*")
      .order("display_order");

    if (error) throw error;

    const chaptersWithCount = await Promise.all(
      (chaptersData ?? []).map(async (chapter) => {
        const { count } = await supabase
          .from("lectures")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("chapter_id", chapter.id)
          .eq("is_published", true);

        return {
          ...chapter,
          lectures_count: count ?? 0,
        };
      })
    );

    setChapters(chaptersWithCount);
  };

  const loadRecentExams = async (studentId: string) => {
    const { data, error } = await supabase
      .from("exam_attempts")
      .select(`
        id,
        score,
        total,
        percentage,
        created_at,
        exams(
          title
        )
      `)
      .eq("student_id", studentId)
      .order("created_at", {
        ascending: false,
      })
      .limit(5);

    if (error) throw error;

    setRecentExams(data as unknown as RecentExam[]);
  };

  const loadTopStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select(`
        full_name,
        average_score,
        total_exams,
        rank
      `)
      .order("average_score", {
        ascending: false,
      })
      .limit(10);

    if (error) throw error;

    setTopStudents((data ?? []) as TopStudent[]);
  };

  const init = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("AUTH USER:", user);

      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data: studentData, error: studentError } =
        await supabase
          .from("students")
          .select("*")
          .eq("auth_id", user.id)
          .single();

      console.log("USER ID:", user.id);
      console.log("STUDENT:", studentData);
      console.log("ERROR:", studentError);

      if (studentError || !studentData) {
        router.replace("/auth");
        return;
      }

      setStudent(studentData);

      await Promise.all([
        loadChapters(),
        loadRecentExams(studentData.id),
        loadTopStudents(),
      ]);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    init();
  }, []);

  const points = Number(student?.points ?? 0);
  const streak = Number(student?.streak ?? 0);
  const solvedExams = Number(student?.total_exams ?? 0);

  const totalLectures = chapters.reduce(
    (sum, c) => sum + c.lectures_count,
    0
  );

  const progress = Math.min(
    Number(student?.average_score ?? 0),
    100
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <Sidebar
          studentName="Loading..."
          points={0}
          streak={0}
        />

        <main className="flex-1 p-4 lg:p-8 lg:mr-72">
          <div className="space-y-8 animate-[pulse_2s_infinite]">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rounded-3xl bg-slate-900 border border-slate-800 p-8 h-64" />
              <div className="space-y-4">
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 h-24" />
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 h-24" />
                <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 h-24" />
              </div>
            </div>
            <div className="grid lg:grid-cols-5 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-slate-900 border border-slate-800 h-64" />
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 h-64" />
              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 h-64" />
            </div>
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 h-64" />
          </div>
        </main>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  return (
    <div className="relative min-h-screen flex bg-slate-950 text-white overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/background.jpg"
          className="h-full w-full object-cover opacity-10"
          alt=""
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/80 to-slate-950" />
      </div>

      <Sidebar
        studentName={student.full_name}
        points={points}
        streak={streak}
      />

      <div className="flex-1 flex flex-col lg:mr-72">
        <main className="flex-1 p-8 lg:p-12">
          <div className="mx-auto max-w-7xl space-y-10">
            {error && (
              <div className="rounded-xl bg-red-500/20 border border-red-500 p-4 text-red-300 flex items-center justify-between">
                <span>{error}</span>
                <button
                  onClick={() => init(true)}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                >
                  إعادة المحاولة
                </button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">لوحة التحكم</h1>

              <div className="flex items-center gap-4">
                <Link
                  href="/profile"
                  className="px-4 py-2 bg-slate-900 border border-cyan-500/20 hover:border-cyan-500 rounded-xl text-cyan-400 transition-colors font-medium"
                >
                  البروفايل
                </Link>

                <Link
                  href="/settings"
                  className="px-4 py-2 bg-slate-900 border border-cyan-500/20 hover:border-cyan-500 rounded-xl text-cyan-400 transition-colors font-medium"
                >
                  الإعدادات
                </Link>

                <button
                  onClick={() => init(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-cyan-500/20 hover:border-cyan-500 rounded-xl text-cyan-400 transition-colors disabled:opacity-50"
                >
                  {refreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "🔄"
                  )}
                  {refreshing ? "جاري التحديث..." : "تحديث البيانات"}
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <FadeIn className="lg:col-span-2 rounded-3xl bg-gradient-to-r from-cyan-900 via-slate-900 to-slate-950 border border-cyan-500/20 p-8">
                <h1 className="text-5xl font-black leading-tight">
                  أهلاً بك،
                  <span className="block mt-2 text-cyan-400">
                    {student.full_name}
                  </span>
                </h1>

                <p className="mt-6 text-slate-300 text-lg leading-8">
                  استمر في حل الامتحانات وجمع النقاط للوصول إلى قمة ترتيب BioPulse.
                </p>

                <div className="mt-8 flex gap-4">
                  <Link href="/chapters">
                    <button className="rounded-xl bg-cyan-500 hover:bg-cyan-600 px-6 py-3 font-bold transition">
                      ابدأ التعلم
                    </button>
                  </Link>

                  <Link href="/results">
                    <button className="rounded-xl border border-cyan-500 text-cyan-400 px-6 py-3 font-bold hover:bg-cyan-500/10 transition">
                      نتائجي
                    </button>
                  </Link>
                </div>

                <div className="mt-8 h-3 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <p className="mt-3 text-cyan-400">
                  نسبة الإنجاز <CountUp end={progress} decimals={1} duration={2} />%
                </p>
              </FadeIn>

              <FadeIn delay={0.1} className="space-y-4">
                <div className="rounded-3xl border border-cyan-500/20 bg-[#081321]/90 backdrop-blur-xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(34,211,238,0.25)]">
                  <p className="text-slate-400">النقاط</p>
                  <h2 className="mt-2 text-4xl font-bold text-cyan-400">
                    <CountUp end={points} duration={2} />
                  </h2>
                </div>

                <div className="rounded-3xl border border-orange-500/20 bg-[#081321]/90 backdrop-blur-xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(251,146,60,0.25)]">
                  <p className="text-slate-400">Streak</p>
                  <h2 className="mt-2 text-4xl font-bold text-orange-400">
                    <CountUp end={streak} duration={2} />
                  </h2>
                </div>

                <div className="rounded-3xl border border-pink-500/20 bg-[#081321]/90 backdrop-blur-xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(236,72,153,0.25)]">
                  <p className="text-slate-400">الامتحانات</p>
                  <h2 className="mt-2 text-4xl font-bold text-pink-400">
                    <CountUp end={solvedExams} duration={2} />
                  </h2>
                </div>
              </FadeIn>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid lg:grid-cols-5 gap-6"
            >
              {chapters.map((chapter, index) => (
                <motion.div key={chapter.id} variants={itemVariants}>
                  <ChapterCard
                    title={chapter.title}
                    teacher={chapter.teacher}
                    lectures={chapter.lectures_count}
                    image={images[index] ?? "/images/chapters/default.png"}
                    color={colors[index % colors.length]}
                    href={`/chapters/${chapter.slug}`}
                  />
                </motion.div>
              ))}
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-6">
              <FadeIn
                delay={0.2}
                direction="left"
                className="rounded-3xl bg-slate-900 border border-cyan-500/20 p-6"
              >
                <h2 className="text-2xl font-bold mb-6">
                  🏆 أفضل 10 طلاب
                </h2>

                {topStudents.length === 0 ? (
                  <p className="text-gray-400">لا يوجد طلاب حتى الآن.</p>
                ) : (
                  <div className="space-y-3">
                    {topStudents.map((topStudent, index) => {
                      const badge =
                        index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg border border-slate-700 p-3"
                        >
                          <div>
                            <p className="font-bold flex items-center gap-2">
                              <span>{badge}</span> {topStudent.full_name}
                            </p>
                            <p className="text-sm text-gray-400">
                              عدد الامتحانات: {topStudent.total_exams ?? 0}
                            </p>
                          </div>

                          <div className="text-xl font-bold text-green-400">
                            <CountUp end={topStudent.average_score ?? 0} decimals={1} duration={2} />%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </FadeIn>

              <FadeIn
                delay={0.2}
                direction="right"
                className="rounded-3xl bg-slate-900 border border-cyan-500/20 p-6"
              >
                <h2 className="text-2xl font-bold mb-6">
                  📊 إحصائياتك
                </h2>

                <div className="space-y-5">
                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span>عدد الامتحانات</span>
                    <span><CountUp end={student.total_exams} duration={2} /></span>
                  </div>

                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span>متوسط الدرجات</span>
                    <span>
                      <CountUp
                        end={student.average_score ?? 0}
                        decimals={1}
                        duration={2}
                      />%
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span>النقاط</span>
                    <span><CountUp end={points} duration={2} /></span>
                  </div>

                  <div className="flex justify-between">
                    <span>ترتيبك</span>
                    <span>#{student.rank}</span>
                  </div>
                </div>
              </FadeIn>
            </div>

            <FadeIn
              delay={0.3}
              className="rounded-3xl bg-slate-900 border border-cyan-500/20 p-6"
            >
              <h2 className="text-2xl font-bold mb-6">
                📝 آخر الامتحانات
              </h2>

              {recentExams.length === 0 ? (
                <p className="text-gray-400">لم تقم بحل أي امتحان حتى الآن.</p>
              ) : (
                <div className="space-y-4">
                  {recentExams.map((exam, index) => {
                    const formattedDate = new Date(exam.created_at).toLocaleDateString("ar-EG", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    });

                    return (
                      <div
                        key={exam.id || index}
                        className="flex items-center justify-between rounded-lg border border-slate-700 p-4"
                      >
                        <div>
                          <h3 className="font-bold">
                            {exam.exams?.title ?? "امتحان"}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {formattedDate}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-bold">
                            {exam.score}/{exam.total}
                          </p>
                          <p className="text-green-400">
                            <CountUp end={Number(exam.percentage ?? 0)} decimals={2} duration={2} />%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </FadeIn>

            <FadeIn
              delay={0.35}
              className="rounded-3xl bg-slate-900 border border-cyan-500/20 p-6"
            >
              <h2 className="text-2xl font-bold mb-5">
                🚀 ابدأ التعلم
              </h2>

              <p className="text-gray-400 mb-6">
                اضغط هنا للدخول إلى جميع الفصول والمحاضرات.
              </p>

              <Link href="/chapters">
                <button className="rounded-xl bg-cyan-600 hover:bg-cyan-700 transition px-6 py-3 font-bold">
                  📚 الذهاب إلى الفصول
                </button>
              </Link>
            </FadeIn>
          </div>
        </main>

        <footer className="py-6 text-center text-gray-500 border-t border-slate-800 mt-20">
          BioPulse © 2027
        </footer>
      </div>
    </div>
  );
}