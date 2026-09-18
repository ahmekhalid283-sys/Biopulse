"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Trophy,
  ArrowRight,
} from "lucide-react";

type Challenge = {
  id: string;
  title: string;
  duration_minutes: number | null;
  passing_score: number | null;
  status: string | null;
};

type Round = {
  id: string;
  round_number: number;
  title: string;
  duration_minutes: number | null;
  passing_score: number | null;
};

type Question = {
  id: string;
  question: string;
  question_type: "mcq" | "true_false" | "written";
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  correct_answer: string;
  marks: number;
  explanation: string | null;
  image_url?: string | null;
  diagram_url?: string | null;
};

type AnswerMap = Record<string, string>;

type Result = {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  pendingReview: boolean;
};

type AnswerStorage =
  | "quick_questions"
  | "challenge_questions";

export default function ChallengePlayPage() {
  const params = useParams();
  const router = useRouter();

  const challengeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [challenge, setChallenge] =
    useState<Challenge | null>(null);

  const [round, setRound] =
    useState<Round | null>(null);

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [answers, setAnswers] =
    useState<AnswerMap>({});

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [secondsLeft, setSecondsLeft] =
    useState<number | null>(null);

  const [finished, setFinished] =
    useState(false);

  const [result, setResult] =
    useState<Result | null>(null);

  const [errorMsg, setErrorMsg] =
    useState("");

  const [studentId, setStudentId] =
    useState<string | null>(null);

  const studentIdRef =
    useRef<string | null>(null);

  const answersRef =
    useRef<AnswerMap>({});

  const questionsRef =
    useRef<Question[]>([]);

  const challengeRef =
    useRef<Challenge | null>(null);

  const roundRef =
    useRef<Round | null>(null);

  const submittingRef =
    useRef(false);

  const finishedRef =
    useRef(false);

  const answerStorageRef =
    useRef<AnswerStorage>(
      "challenge_questions"
    );

  useEffect(() => {
    studentIdRef.current = studentId;
  }, [studentId]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    challengeRef.current = challenge;
  }, [challenge]);

  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  useEffect(() => {
    if (challengeId) {
      loadQuiz();
    }
  }, [challengeId]);

  // ==============================
  // TIMER
  // ==============================

  useEffect(() => {
    if (
      secondsLeft === null ||
      finished ||
      loading
    ) {
      return;
    }

    if (secondsLeft <= 0) {
      handleSubmit(true);
      return;
    }

    const timer = setTimeout(() => {
      setSecondsLeft((value) =>
        value !== null
          ? value - 1
          : value
      );
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    secondsLeft,
    finished,
    loading,
  ]);

  // ==============================
  // MAP QUESTION
  // ==============================

  function mapQuestion(q: any): Question {
    const rawType = String(
      q.question_type || "mcq"
    ).toLowerCase();

    const question_type: Question["question_type"] =
      rawType === "essay" ||
      rawType === "written"
        ? "written"
        : rawType === "true_false"
          ? "true_false"
          : "mcq";

    const text =
      q.question ||
      q.question_text ||
      "";

    let option_a =
      q.option_a ?? null;

    let option_b =
      q.option_b ?? null;

    let option_c =
      q.option_c ?? null;

    let option_d =
      q.option_d ?? null;

    // questions.options ممكن تكون Array
    if (Array.isArray(q.options)) {
      option_a =
        q.options[0] ?? option_a;

      option_b =
        q.options[1] ?? option_b;

      option_c =
        q.options[2] ?? option_c;

      option_d =
        q.options[3] ?? option_d;
    }

    // وممكن تكون JSON string
    if (
      typeof q.options === "string"
    ) {
      try {
        const parsed =
          JSON.parse(q.options);

        if (Array.isArray(parsed)) {
          option_a =
            parsed[0] ?? option_a;

          option_b =
            parsed[1] ?? option_b;

          option_c =
            parsed[2] ?? option_c;

          option_d =
            parsed[3] ?? option_d;
        }
      } catch {
        // نتجاهلها ونستخدم option_a/b/c/d
      }
    }

    if (
      question_type ===
      "true_false"
    ) {
      option_a =
        option_a || "صح";

      option_b =
        option_b || "خطأ";
    }

    return {
      id: q.id,

      question: text,

      question_type,

      option_a,

      option_b,

      option_c,

      option_d,

      correct_answer:
        String(
          q.correct_answer ?? ""
        ),

      marks:
        Number(
          q.marks ?? q.points
        ) || 1,

      explanation:
        q.explanation ?? null,

      image_url:
        q.image_url ?? null,

      diagram_url:
        q.diagram_url ?? null,
    };
  }

  // ==============================
  // LOAD QUIZ
  // ==============================

  async function loadQuiz() {
    try {
      setLoading(true);
      setErrorMsg("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "Get user error:",
          JSON.stringify(
            userError,
            null,
            2
          )
        );
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      // ============================
      // STUDENT
      // ============================

      const {
        data: student,
        error: studentError,
      } = await supabase
        .from("students")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();

      if (studentError) {
        console.error(
          "Student load error:",
          JSON.stringify(
            studentError,
            null,
            2
          )
        );
      }

      if (!student?.id) {
        setErrorMsg(
          "لم يتم العثور على بيانات الطالب"
        );
        return;
      }

      setStudentId(student.id);
      studentIdRef.current =
        student.id;

      // ============================
      // CHALLENGE
      // ============================

      const {
        data: challengeData,
        error: challengeError,
      } = await supabase
        .from("challenges")
        .select(
          "id, title, duration_minutes, passing_score, status"
        )
        .eq("id", challengeId)
        .single();

      if (challengeError) {
        console.error(
          "Challenge load error:",
          JSON.stringify(
            challengeError,
            null,
            2
          )
        );
      }

      if (
        challengeError ||
        !challengeData
      ) {
        setErrorMsg(
          "التحدي غير موجود أو غير متاح"
        );
        return;
      }

      setChallenge(challengeData);
      challengeRef.current =
        challengeData;

      // ============================
      // ROUNDS
      // ============================

      const {
        data: roundsData,
        error: roundsError,
      } = await supabase
        .from("challenge_rounds")
        .select(
          "id, round_number, title, duration_minutes, passing_score"
        )
        .eq(
          "challenge_id",
          challengeId
        )
        .order(
          "round_number",
          {
            ascending: true,
          }
        );

      if (roundsError) {
        console.error(
          "Rounds load error:",
          JSON.stringify(
            roundsError,
            null,
            2
          )
        );
      }

      const currentRound =
        roundsData?.[0] || null;

      setRound(currentRound);
      roundRef.current =
        currentRound;

      // ==========================================
      // QUICK CHALLENGE
      // ==========================================

      if (!currentRound) {
        answerStorageRef.current =
          "quick_questions";

        let quickQuestions:
          | any[]
          | null = null;

        // أولاً من questions
        const {
          data: fromQuestions,
          error:
            questionsError,
        } = await supabase
          .from("questions")
          .select("*")
          .eq(
            "challenge_id",
            challengeId
          )
          .order(
            "created_at",
            {
              ascending: true,
            }
          );

        if (questionsError) {
          console.error(
            "Quick questions load error:",
            JSON.stringify(
              questionsError,
              null,
              2
            )
          );
        }

        if (
          fromQuestions &&
          fromQuestions.length > 0
        ) {
          quickQuestions =
            fromQuestions;
        } else {
          // fallback فقط لو مفيش questions
          const {
            data: fromChallengeQuestions,
            error:
              challengeQuestionsError,
          } = await supabase
            .from(
              "challenge_questions"
            )
            .select("*")
            .eq(
              "challenge_id",
              challengeId
            )
            .order(
              "created_at",
              {
                ascending: true,
              }
            );

          if (
            challengeQuestionsError
          ) {
            console.error(
              "Fallback challenge questions error:",
              JSON.stringify(
                challengeQuestionsError,
                null,
                2
              )
            );
          }

          if (
            fromChallengeQuestions &&
            fromChallengeQuestions.length >
              0
          ) {
            quickQuestions =
              fromChallengeQuestions;

            // لأن الـ IDs هنا من challenge_questions
            answerStorageRef.current =
              "challenge_questions";
          }
        }

        if (
          !quickQuestions ||
          quickQuestions.length === 0
        ) {
          setErrorMsg(
            "لا توجد أسئلة مرتبطة بهذا التحدي"
          );
          return;
        }

        const mapped =
          quickQuestions.map(
            mapQuestion
          );

        setQuestions(mapped);
        questionsRef.current =
          mapped;

        const duration =
          challengeData.duration_minutes ||
          30;

        setSecondsLeft(
          duration * 60
        );

        return;
      }

      // ==========================================
      // ELIMINATION CHALLENGE
      // ==========================================

      answerStorageRef.current =
        "challenge_questions";

      const {
        data: links,
        error: linksError,
      } = await supabase
        .from(
          "challenge_round_questions"
        )
        .select(
          "question_id, question_order"
        )
        .eq(
          "round_id",
          currentRound.id
        )
        .order(
          "question_order",
          {
            ascending: true,
          }
        );

      if (linksError) {
        console.error(
          "Round questions links error:",
          JSON.stringify(
            linksError,
            null,
            2
          )
        );
      }

      if (
        !links ||
        links.length === 0
      ) {
        setErrorMsg(
          "لا توجد أسئلة في هذا الدور"
        );
        return;
      }

      const ids =
        links.map(
          (item) =>
            item.question_id
        );

      const {
        data: eliminationQuestions,
        error:
          eliminationQuestionsError,
      } = await supabase
        .from(
          "challenge_questions"
        )
        .select("*")
        .in("id", ids);

      if (
        eliminationQuestionsError
      ) {
        console.error(
          "Elimination questions error:",
          JSON.stringify(
            eliminationQuestionsError,
            null,
            2
          )
        );
      }

      if (
        eliminationQuestionsError ||
        !eliminationQuestions
      ) {
        setErrorMsg(
          "فشل تحميل أسئلة الدور"
        );
        return;
      }

      const orderMap =
        new Map(
          links.map(
            (item) => [
              item.question_id,
              item.question_order ??
                0,
            ]
          )
        );

      const mapped =
        [...eliminationQuestions]
          .sort(
            (a, b) =>
              (orderMap.get(
                a.id
              ) ?? 0) -
              (orderMap.get(
                b.id
              ) ?? 0)
          )
          .map(mapQuestion);

      setQuestions(mapped);
      questionsRef.current =
        mapped;

      const duration =
        currentRound.duration_minutes ||
        challengeData.duration_minutes ||
        30;

      setSecondsLeft(
        duration * 60
      );
    } catch (err: any) {
      console.error(
        "Load quiz fatal error:",
        err
      );

      setErrorMsg(
        err?.message ||
          "حدث خطأ أثناء تحميل التحدي"
      );
    } finally {
      setLoading(false);
    }
  }

  // ==============================
  // SELECT ANSWER
  // ==============================

  function selectAnswer(
    questionId: string,
    value: string
  ) {
    if (finishedRef.current) {
      return;
    }

    setAnswers((prev) => {
      const next = {
        ...prev,
        [questionId]: value,
      };

      answersRef.current =
        next;

      return next;
    });
  }

  // ==============================
  // NORMALIZE CORRECT ANSWER
  // ==============================

  function normalizeCorrect(
    q: Question
  ): string {
    const raw = String(
      q.correct_answer || ""
    ).trim();

    const upper =
      raw.toUpperCase();

    // True / False
    if (
      q.question_type ===
      "true_false"
    ) {
      if (
        raw === "صح" ||
        upper === "TRUE" ||
        upper === "A"
      ) {
        return "A";
      }

      if (
        raw === "خطأ" ||
        upper === "FALSE" ||
        upper === "B"
      ) {
        return "B";
      }
    }

    // A/B/C/D
    if (
      ["A", "B", "C", "D"].includes(
        upper
      )
    ) {
      return upper;
    }

    // الإجابة محفوظة كنص الاختيار
    if (
      q.option_a &&
      raw ===
        q.option_a.trim()
    ) {
      return "A";
    }

    if (
      q.option_b &&
      raw ===
        q.option_b.trim()
    ) {
      return "B";
    }

    if (
      q.option_c &&
      raw ===
        q.option_c.trim()
    ) {
      return "C";
    }

    if (
      q.option_d &&
      raw ===
        q.option_d.trim()
    ) {
      return "D";
    }

    return upper;
  }

  // ==============================
  // CHECK ANSWER
  // ==============================

  function isCorrect(
    q: Question,
    ansMap: AnswerMap
  ) {
    if (
      q.question_type ===
      "written"
    ) {
      return false;
    }

    const user =
      (
        ansMap[q.id] || ""
      )
        .trim()
        .toUpperCase();

    return (
      user ===
      normalizeCorrect(q)
    );
  }

  // ==============================
  // ENSURE PARTICIPANT
  // ==============================

  async function ensureParticipant(
    sid: string,
    chId: string
  ) {
    const {
      data: existing,
      error: existingError,
    } = await supabase
      .from(
        "challenge_participants"
      )
      .select("id")
      .eq(
        "challenge_id",
        chId
      )
      .eq(
        "student_id",
        sid
      )
      .maybeSingle();

    if (existingError) {
      console.error(
        "Participant lookup error:",
        JSON.stringify(
          existingError,
          null,
          2
        )
      );
    }

    if (existing?.id) {
      return existing.id;
    }

    const {
      data: created,
      error: createError,
    } = await supabase
      .from(
        "challenge_participants"
      )
      .insert({
        challenge_id:
          chId,
        student_id: sid,
        status:
          "registered",
      })
      .select("id")
      .single();

    if (
      createError ||
      !created
    ) {
      console.error(
        "Participant create error:",
        JSON.stringify(
          createError,
          null,
          2
        )
      );

      throw new Error(
        createError?.message ||
          "فشل تسجيل الطالب في التحدي"
      );
    }

    return created.id as string;
  }

  // ==============================
  // SUBMIT
  // ==============================

  async function handleSubmit(
    auto = false
  ) {
    if (
      submittingRef.current ||
      finishedRef.current
    ) {
      return;
    }

    const qs =
      questionsRef.current;

    const ans =
      answersRef.current;

    const sid =
      studentIdRef.current;

    const ch =
      challengeRef.current;

    const rd =
      roundRef.current;

    if (!auto) {
      const unanswered =
        qs.filter(
          (q) =>
            !ans[q.id]?.trim()
        );

      if (
        unanswered.length >
        0
      ) {
        const ok = confirm(
          `يوجد ${unanswered.length} سؤال بدون إجابة. هل تريد التسليم الآن؟`
        );

        if (!ok) {
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      submittingRef.current =
        true;

      if (!sid || !ch) {
        alert(
          "بيانات الطالب أو التحدي غير مكتملة"
        );
        return;
      }

      // ==========================================
      // CHECK WRITTEN
      // ==========================================

      const hasWritten =
        qs.some(
          (q) =>
            q.question_type ===
            "written"
        );

      // ==========================================
      // CALCULATE AUTO SCORE
      // ==========================================

      let score = 0;
      let total = 0;
      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;

      for (const q of qs) {
        const marks =
          Number(q.marks) || 0;

        total += marks;

        const userAns =
          (
            ans[q.id] || ""
          ).trim();

        if (!userAns) {
          unansweredCount++;
          continue;
        }

        // المقالي لا يتصحح تلقائيًا
        if (
          q.question_type ===
          "written"
        ) {
          continue;
        }

        if (
          isCorrect(q, ans)
        ) {
          score += marks;
          correctCount++;
        } else {
          wrongCount++;
        }
      }

      const percentage =
        total > 0
          ? Number(
              (
                (score /
                  total) *
                100
              ).toFixed(2)
            )
          : 0;

      const passing =
        Number(
          rd?.passing_score ??
            ch.passing_score ??
            50
        );

      const passed =
        !hasWritten &&
        percentage >=
          passing;

      // ==========================================
      // PARTICIPANT
      // ==========================================

      const participantId =
        await ensureParticipant(
          sid,
          ch.id
        );

      // ==========================================
      // RETRY NUMBER
      // ==========================================

      let attemptsQuery =
        supabase
          .from(
            "challenge_attempts"
          )
          .select(
            "retry_number"
          )
          .eq(
            "participant_id",
            participantId
          )
          .order(
            "retry_number",
            {
              ascending:
                false,
            }
          )
          .limit(1);

      if (rd?.id) {
        attemptsQuery =
          attemptsQuery.eq(
            "round_id",
            rd.id
          );
      } else {
        attemptsQuery =
          attemptsQuery.is(
            "round_id",
            null
          );
      }

      const {
        data: lastAttempts,
        error:
          attemptsError,
      } = await attemptsQuery;

      if (attemptsError) {
        console.error(
          "Last attempts error:",
          JSON.stringify(
            attemptsError,
            null,
            2
          )
        );
      }

      const nextRetry =
        Number(
          lastAttempts?.[0]
            ?.retry_number || 0
        ) + 1;

      // ==========================================
      // TIME
      // ==========================================

      const totalDuration =
        (
          rd?.duration_minutes ||
          ch.duration_minutes ||
          30
        ) * 60;

      const elapsed =
        secondsLeft !== null
          ? Math.max(
              0,
              totalDuration -
                secondsLeft
            )
          : totalDuration;

      const startedAt =
        new Date(
          Date.now() -
            elapsed * 1000
        ).toISOString();

      // ==========================================
      // INSERT ATTEMPT
      // ==========================================

      const attemptPayload = {
        challenge_id:
          ch.id,

        round_id:
          rd?.id ?? null,

        participant_id:
          participantId,

        // مهم جدًا:
        // لا نصفر الدرجة بسبب وجود مقالي
        score,

        total_score:
          total,

        percentage,

        correct_count:
          correctCount,

        wrong_count:
          wrongCount,

        unanswered_count:
          unansweredCount,

        duration_seconds:
          elapsed || 1,

        started_at:
          startedAt,

        finished_at:
          new Date().toISOString(),

        qualified: false,

        retry_number:
          nextRetry,
      };

      const {
        data:
          insertedAttempt,
        error:
          attemptError,
      } = await supabase
        .from(
          "challenge_attempts"
        )
        .insert(
          attemptPayload
        )
        .select("id")
        .single();

      if (
        attemptError ||
        !insertedAttempt
      ) {
        console.error(
          "Attempt error:",
          JSON.stringify(
            attemptError,
            null,
            2
          )
        );

        alert(
          attemptError?.message ||
            "فشل حفظ المحاولة"
        );

        return;
      }

      // ==========================================
      // SAVE ANSWERS
      // ==========================================

      const answersPayload =
        qs.map(
          (q, index) => {
            const userAns =
              (
                ans[q.id] ||
                ""
              ).trim();

            const written =
              q.question_type ===
              "written";

            const correct =
              !written &&
              isCorrect(
                q,
                ans
              );

            return {
              attempt_id:
                insertedAttempt.id,

              question_id:
                q.id,

              student_answer:
                userAns ||
                null,

              selected_option:
                !written
                  ? userAns ||
                    null
                  : null,

              // للمقالي نسيبه NULL
              // لحد ما الأدمن يصححه
              is_correct:
                written
                  ? null
                  : correct,

              // للمقالي NULL
              // بدل 0 عشان نعرف إنه Pending
              marks_awarded:
                written
                  ? null
                  : correct
                    ? Number(
                        q.marks
                      ) || 0
                    : 0,

              question_order:
                index + 1,

              answer_time_seconds:
                0,
            };
          }
        );

      if (
        answersPayload.length >
        0
      ) {
        // ========================================
        // QUICK QUESTIONS TABLE
        // ========================================

        if (
          answerStorageRef.current ===
          "quick_questions"
        ) {
          const {
            error:
              quickAnswersError,
          } = await supabase
            .from(
              "quick_challenge_attempt_answers"
            )
            .insert(
              answersPayload
            );

          if (
            quickAnswersError
          ) {
            console.error(
              "Quick answers error:",
              quickAnswersError
            );

            console.error(
              "Quick answers error details:",
              JSON.stringify(
                {
                  message:
                    quickAnswersError.message,
                  details:
                    quickAnswersError.details,
                  hint:
                    quickAnswersError.hint,
                  code:
                    quickAnswersError.code,
                },
                null,
                2
              )
            );

            alert(
              quickAnswersError
                .message ||
                "تم حفظ المحاولة لكن فشل حفظ تفاصيل الإجابات"
            );

            return;
          }
        }

        // ========================================
        // CHALLENGE QUESTIONS TABLE
        // ========================================

        else {
          const {
            error:
              answersError,
          } = await supabase
            .from(
              "challenge_attempt_answers"
            )
            .insert(
              answersPayload
            );

          if (
            answersError
          ) {
            console.error(
              "Answers error:",
              answersError
            );

            console.error(
              "Answers error details:",
              JSON.stringify(
                {
                  message:
                    answersError.message,
                  details:
                    answersError.details,
                  hint:
                    answersError.hint,
                  code:
                    answersError.code,
                },
                null,
                2
              )
            );

            alert(
              answersError.message ||
                "تم حفظ المحاولة لكن فشل حفظ تفاصيل الإجابات"
            );

            return;
          }
        }
      }

      // ==========================================
      // RESULT
      // ==========================================

      setResult({
        score,
        total,
        percentage,
        passed,
        pendingReview:
          hasWritten,
      });

      setFinished(true);
      finishedRef.current =
        true;
    } catch (err: any) {
      console.error(
        "Submit fatal error:",
        err
      );

      if (!auto) {
        alert(
          err?.message ||
            "فشل تسليم التحدي"
        );
      }
    } finally {
      setSubmitting(false);
      submittingRef.current =
        false;
    }
  }

  // ==============================
  // FORMAT TIME
  // ==============================

  function formatTime(
    sec: number
  ) {
    const m =
      Math.floor(sec / 60);

    const s =
      sec % 60;

    return `${m
      .toString()
      .padStart(
        2,
        "0"
      )}:${s
      .toString()
      .padStart(
        2,
        "0"
      )}`;
  }

  const current =
    questions[currentIndex];

  const answeredCount =
    useMemo(
      () =>
        questions.filter(
          (q) =>
            answers[
              q.id
            ]?.trim()
        ).length,
      [questions, answers]
    );

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950 text-white"
      >
        جاري تحميل التحدي...
      </main>
    );
  }

  // ==============================
  // ERROR
  // ==============================

  if (errorMsg) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-white"
      >
        <p className="text-center text-lg font-bold text-red-400">
          {errorMsg}
        </p>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/challenges/${challengeId}`
            )
          }
          className="mt-6 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-400"
        >
          رجوع
        </button>
      </main>
    );
  }

  // ==============================
  // RESULT - PENDING REVIEW
  // ==============================

  if (
    finished &&
    result &&
    result.pendingReview
  ) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white"
      >
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
            <Clock className="h-8 w-8" />
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            تم تسليم إجاباتك
          </h1>

          <p className="mt-3 text-slate-400">
            يوجد أسئلة مقالية تحتاج
            إلى تصحيح يدوي.
          </p>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs text-slate-500">
              الدرجة الحالية
            </p>

            <p className="mt-1 text-2xl font-black text-cyan-400">
              {result.score} /{" "}
              {result.total}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              النسبة الحالية:{" "}
              {result.percentage}%
            </p>
          </div>

          <p className="mt-4 text-xs leading-6 text-slate-500">
            الدرجة الحالية تشمل الأسئلة
            الموضوعية فقط، وسيتم تحديث
            النتيجة بعد تصحيح الأسئلة
            المقالية.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/challenges"
              )
            }
            className="mt-8 w-full rounded-xl bg-cyan-500 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400"
          >
            العودة للتحديات
          </button>
        </div>
      </main>
    );
  }

  // ==============================
  // RESULT - FINAL
  // ==============================

  if (
    finished &&
    result
  ) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white"
      >
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
              result.passed
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-red-500/15 text-red-400"
            }`}
          >
            <Trophy className="h-8 w-8" />
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            {result.passed
              ? "أحسنت! نجحت"
              : "انتهى التحدي"}
          </h1>

          <p className="mt-2 text-slate-400">
            {challenge?.title}
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-800/80 p-3">
              <p className="text-xs text-slate-500">
                الدرجة
              </p>

              <p className="mt-1 text-lg font-bold">
                {result.score}/
                {result.total}
              </p>
            </div>

            <div className="rounded-xl bg-slate-800/80 p-3">
              <p className="text-xs text-slate-500">
                النسبة
              </p>

              <p className="mt-1 text-lg font-bold">
                {result.percentage}%
              </p>
            </div>

            <div className="rounded-xl bg-slate-800/80 p-3">
              <p className="text-xs text-slate-500">
                الحالة
              </p>

              <p
                className={`mt-1 text-lg font-bold ${
                  result.passed
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {result.passed
                  ? "ناجح"
                  : "راسب"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/challenges"
              )
            }
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للتحديات
          </button>
        </div>
      </main>
    );
  }

  // ==============================
  // NO QUESTIONS
  // ==============================

  if (!current) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-950 text-white"
      >
        لا توجد أسئلة
      </main>
    );
  }

  // ==============================
  // OPTIONS
  // ==============================

  const options =
    current.question_type ===
    "true_false"
      ? [
          {
            letter: "A",
            text:
              current.option_a ||
              "صح",
          },
          {
            letter: "B",
            text:
              current.option_b ||
              "خطأ",
          },
        ]
      : current.question_type ===
          "mcq"
        ? [
            {
              letter: "A",
              text:
                current.option_a,
            },
            {
              letter: "B",
              text:
                current.option_b,
            },
            {
              letter: "C",
              text:
                current.option_c,
            },
            {
              letter: "D",
              text:
                current.option_d,
            },
          ].filter(
            (option) =>
              option.text &&
              option.text !== "-"
          )
        : [];

  // ==============================
  // PAGE
  // ==============================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-950 text-white"
    >
      {/* TOP BAR */}
      <div className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">
              {challenge?.title}
            </p>

            <p className="text-xs text-slate-500">
              {round?.title ||
                "تحدي سريع"}{" "}
              • {answeredCount}/
              {questions.length}{" "}
              تمت الإجابة
            </p>
          </div>

          <div
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${
              secondsLeft !== null &&
              secondsLeft <= 60
                ? "bg-red-500/15 text-red-400"
                : "bg-slate-800 text-cyan-400"
            }`}
          >
            <Clock className="h-4 w-4" />

            {secondsLeft !== null
              ? formatTime(
                  secondsLeft
                )
              : "--:--"}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
        {/* PROGRESS */}
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-cyan-500 transition-all"
            style={{
              width: `${
                questions.length
                  ? ((currentIndex +
                      1) /
                      questions.length) *
                    100
                  : 0
              }%`,
            }}
          />
        </div>

        {/* QUESTION */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>
              السؤال{" "}
              {currentIndex + 1}{" "}
              من{" "}
              {questions.length}
            </span>

            <span>
              {current.marks} درجة
            </span>
          </div>

          <h2 className="text-lg font-bold leading-8 sm:text-xl">
            {current.question}
          </h2>

          {/* QUESTION IMAGE */}
          {current.image_url && (
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-2">
              <img
                src={
                  current.image_url
                }
                alt="صورة السؤال"
                className="max-h-80 w-full rounded-lg object-contain"
              />
            </div>
          )}

          {/* DIAGRAM IMAGE */}
          {current.diagram_url && (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-2">
              <img
                src={
                  current.diagram_url
                }
                alt="رسم السؤال"
                className="max-h-80 w-full rounded-lg object-contain"
              />
            </div>
          )}

          {/* MCQ / TRUE FALSE */}
          {current.question_type !==
            "written" && (
            <div className="mt-6 space-y-3">
              {options.map(
                (option) => {
                  const selected =
                    answers[
                      current.id
                    ] ===
                    option.letter;

                  return (
                    <button
                      key={
                        option.letter
                      }
                      type="button"
                      disabled={
                        submitting
                      }
                      onClick={() =>
                        selectAnswer(
                          current.id,
                          option.letter
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-right text-sm font-bold transition ${
                        selected
                          ? "border-cyan-500 bg-cyan-500/15 text-cyan-300"
                          : "border-slate-700 bg-slate-800/50 text-slate-200 hover:border-slate-600"
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs ${
                          selected
                            ? "bg-cyan-500 text-slate-950"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {
                          option.letter
                        }
                      </span>

                      <span className="leading-6">
                        {
                          option.text
                        }
                      </span>

                      {selected && (
                        <CheckCircle2 className="mr-auto h-4 w-4 shrink-0 text-cyan-400" />
                      )}
                    </button>
                  );
                }
              )}
            </div>
          )}

          {/* WRITTEN */}
          {current.question_type ===
            "written" && (
            <textarea
              value={
                answers[
                  current.id
                ] || ""
              }
              onChange={(event) =>
                selectAnswer(
                  current.id,
                  event.target.value
                )
              }
              disabled={
                submitting
              }
              rows={6}
              placeholder="اكتب إجابتك هنا..."
              className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-slate-500 focus:border-cyan-500 disabled:opacity-70"
            />
          )}
        </div>

        {/* NAVIGATION */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            disabled={
              currentIndex === 0 ||
              submitting
            }
            onClick={() =>
              setCurrentIndex(
                (index) =>
                  Math.max(
                    0,
                    index - 1
                  )
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </button>

          {currentIndex <
          questions.length - 1 ? (
            <button
              type="button"
              disabled={
                submitting
              }
              onClick={() =>
                setCurrentIndex(
                  (index) =>
                    Math.min(
                      questions.length -
                        1,
                      index + 1
                    )
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={
                submitting
              }
              onClick={() =>
                handleSubmit(false)
              }
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "جاري التسليم..."
                : "تسليم الإجابات"}
            </button>
          )}
        </div>

        {/* QUESTION NUMBERS */}
        <div className="flex flex-wrap gap-2 pb-8">
          {questions.map(
            (question, index) => {
              const answered =
                Boolean(
                  answers[
                    question.id
                  ]?.trim()
                );

              return (
                <button
                  key={
                    question.id
                  }
                  type="button"
                  disabled={
                    submitting
                  }
                  onClick={() =>
                    setCurrentIndex(
                      index
                    )
                  }
                  className={`h-9 w-9 rounded-lg text-xs font-bold transition ${
                    index ===
                    currentIndex
                      ? "bg-cyan-500 text-slate-950"
                      : answered
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-800 text-slate-400"
                  } disabled:opacity-60`}
                >
                  {index + 1}
                </button>
              );
            }
          )}
        </div>
      </div>
    </main>
  );
}