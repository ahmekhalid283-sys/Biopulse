"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  House,
  User,
  Mail,
  Camera,
  Lock,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

type Student = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
};

export default function AccountSettingsPage() {
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);
  const [showNewPassword, setShowNewPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);
  const [uploading, setUploading] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAccount();
  }, []);

  // =========================================================
  // تحميل بيانات الحساب
  // =========================================================

  async function loadAccount() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("students")
        .select("id, full_name, email, avatar_url")
        .eq("auth_id", user.id)
        .single();

      if (error || !data) {
        console.error("Account loading error:", error);

        alert("لم يتم العثور على بيانات الحساب.");
        return;
      }

      setStudent(data);
      setFullName(data.full_name || "");
      setEmail(data.email || user.email || "");
    } catch (error) {
      console.error("Load account error:", error);
      alert("حدث خطأ أثناء تحميل بيانات الحساب.");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // تغيير الاسم
  // =========================================================

  async function updateName() {
    if (!student) return;

    const trimmedName = fullName.trim();

    if (!trimmedName) {
      alert("من فضلك اكتب الاسم.");
      return;
    }

    if (trimmedName.length < 3) {
      alert("الاسم يجب أن يكون 3 أحرف على الأقل.");
      return;
    }

    try {
      setSavingName(true);

      const { error } = await supabase
        .from("students")
        .update({
          full_name: trimmedName,
        })
        .eq("id", student.id);

      if (error) {
        console.error("Update name error:", error);
        alert(error.message);
        return;
      }

      setStudent((prev) =>
        prev
          ? {
              ...prev,
              full_name: trimmedName,
            }
          : prev
      );

      alert("تم تغيير الاسم بنجاح.");
    } catch (error) {
      console.error("Update name error:", error);
      alert("حدث خطأ أثناء تغيير الاسم.");
    } finally {
      setSavingName(false);
    }
  }

  // =========================================================
  // رفع الصورة
  // =========================================================

  async function uploadAvatar(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file || !student) return;

    try {
      setUploading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("يجب تسجيل الدخول أولاً.");
        return;
      }

      // نوع الملف
      if (!file.type.startsWith("image/")) {
        alert("من فضلك اختر صورة فقط.");
        return;
      }

      // حجم الصورة
      if (file.size > 5 * 1024 * 1024) {
        alert("حجم الصورة يجب ألا يتجاوز 5MB.");
        return;
      }

      const fileExt =
        file.name.split(".").pop()?.toLowerCase() || "jpg";

      /*
       * نستخدم auth user id كاسم ثابت للملف.
       * upsert = true يسمح باستبدال الصورة القديمة.
       */
      const fileName = `${user.id}.${fileExt}`;

      const { error: uploadError } =
        await supabase.storage
          .from("avatars")
          .upload(fileName, file, {
            upsert: true,
            contentType: file.type,
          });

      if (uploadError) {
        console.error("Avatar upload error:", uploadError);
        alert(uploadError.message);
        return;
      }

      const { data: publicData } =
        supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

      const publicUrl =
        `${publicData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } =
        await supabase
          .from("students")
          .update({
            avatar_url: publicUrl,
          })
          .eq("id", student.id);

      if (updateError) {
        console.error(
          "Avatar database update error:",
          updateError
        );

        alert(updateError.message);
        return;
      }

      setStudent((prev) =>
        prev
          ? {
              ...prev,
              avatar_url: publicUrl,
            }
          : prev
      );

      alert("تم تغيير الصورة بنجاح.");
    } catch (error) {
      console.error("Upload avatar error:", error);
      alert("حدث خطأ أثناء رفع الصورة.");
    } finally {
      setUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  // =========================================================
  // تغيير كلمة السر
  // =========================================================

  async function changePassword() {
    if (!currentPassword) {
      alert("اكتب كلمة المرور الحالية.");
      return;
    }

    if (!newPassword) {
      alert("اكتب كلمة المرور الجديدة.");
      return;
    }

    if (newPassword.length < 6) {
      alert(
        "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("تأكيد كلمة المرور غير مطابق.");
      return;
    }

    if (currentPassword === newPassword) {
      alert(
        "كلمة المرور الجديدة يجب أن تكون مختلفة عن القديمة."
      );
      return;
    }

    try {
      setChangingPassword(true);

      // الحصول على المستخدم الحالي
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user || !user.email) {
        alert("لم يتم العثور على بيانات تسجيل الدخول.");
        return;
      }

      /*
       * أولاً نتحقق من كلمة المرور القديمة
       * عن طريق تسجيل الدخول بنفس الحساب.
       */
      const { error: verifyError } =
        await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

      if (verifyError) {
        alert("كلمة المرور الحالية غير صحيحة.");
        return;
      }

      // تغيير كلمة المرور
      const { error: passwordError } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (passwordError) {
        console.error(
          "Change password error:",
          passwordError
        );

        alert(passwordError.message);
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      alert("تم تغيير كلمة المرور بنجاح.");
    } catch (error) {
      console.error("Password change error:", error);
      alert("حدث خطأ أثناء تغيير كلمة المرور.");
    } finally {
      setChangingPassword(false);
    }
  }

  // =========================================================
  // Loading
  // =========================================================

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#020617] text-white"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-400" />

          <p className="text-slate-400">
            جاري تحميل إعدادات الحساب...
          </p>
        </div>
      </main>
    );
  }

  if (!student) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#020617] text-white"
      >
        <div className="text-center">
          <p className="mb-5 text-slate-400">
            لم يتم العثور على الحساب.
          </p>

          <Link
            href="/auth"
            className="rounded-xl bg-cyan-500 px-6 py-3 font-bold text-white"
          >
            تسجيل الدخول
          </Link>
        </div>
      </main>
    );
  }

  const avatar =
    student.avatar_url || "/images/default-avatar.png";

  // =========================================================
  // الصفحة
  // =========================================================

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#020617] px-4 py-8 text-white sm:px-6 lg:px-10"
    >
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute right-1/4 top-0 h-[400px] w-[400px] rounded-full bg-cyan-500/[0.06] blur-[120px]" />

        <div className="absolute bottom-0 left-10 h-[400px] w-[400px] rounded-full bg-purple-500/[0.06] blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-4xl">

        {/* =====================================================
            Top Navigation
        ===================================================== */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">

          <Link
            href="/settings"
            className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 font-bold text-cyan-400 transition hover:bg-cyan-500/20"
          >
            <ArrowRight className="h-5 w-5" />
            الإعدادات
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-3 font-bold text-cyan-400 transition hover:bg-cyan-500/20"
          >
            <House className="h-5 w-5" />
            الرئيسية
          </Link>

        </div>

        {/* =====================================================
            Main Container
        ===================================================== */}

        <div className="overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-[#081321]/95 shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl">

          {/* ===================================================
              Header
          =================================================== */}

          <div className="border-b border-cyan-500/10 px-6 py-8 text-center sm:px-10">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
              <User className="h-8 w-8" />
            </div>

            <h1 className="text-3xl font-black text-purple-400 sm:text-4xl">
              إعدادات الحساب
            </h1>

            <p className="mt-3 text-sm text-slate-400 sm:text-base">
              تعديل بيانات حسابك الشخصية والأمان
            </p>

          </div>

          <div className="space-y-8 p-5 sm:p-8">

            {/* =================================================
                Profile Image
            ================================================= */}

            <section className="rounded-3xl border border-cyan-500/20 bg-slate-900/60 p-6">

              <div className="mb-6 flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10">
                  <Camera className="h-6 w-6 text-cyan-400" />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    الصورة الشخصية
                  </h2>

                  <p className="text-sm text-slate-500">
                    يمكنك تغيير صورتك الشخصية
                  </p>
                </div>

              </div>

              <div className="flex flex-col items-center gap-5 sm:flex-row">

                <div className="relative">

                  <img
                    src={avatar}
                    alt="الصورة الشخصية"
                    className="h-32 w-32 cursor-pointer rounded-full border-4 border-cyan-400 object-cover shadow-lg shadow-cyan-950/30 transition hover:scale-105"
                    onClick={() =>
                      setPreviewImage(avatar)
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={uploading}
                    className="absolute bottom-0 left-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-950 bg-cyan-500 text-white transition hover:bg-cyan-600 disabled:opacity-50"
                  >
                    <Camera className="h-5 w-5" />
                  </button>

                </div>

                <div className="text-center sm:text-right">

                  <p className="font-bold text-white">
                    تغيير الصورة
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    JPG أو PNG — بحد أقصى 5MB
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={uploading}
                    className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 font-bold text-cyan-400 transition hover:bg-cyan-500/20 disabled:opacity-50"
                  >
                    {uploading
                      ? "جاري رفع الصورة..."
                      : "اختيار صورة"}
                  </button>

                </div>

              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={uploadAvatar}
              />

            </section>

            {/* =================================================
                Name
            ================================================= */}

            <section className="rounded-3xl border border-purple-500/20 bg-slate-900/60 p-6">

              <div className="mb-6 flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                  <User className="h-6 w-6 text-purple-400" />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    البيانات الشخصية
                  </h2>

                  <p className="text-sm text-slate-500">
                    تعديل الاسم الظاهر داخل المنصة
                  </p>
                </div>

              </div>

              <label className="mb-2 block text-sm font-bold text-slate-300">
                الاسم بالكامل
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500"
                placeholder="اكتب اسمك"
              />

              <button
                type="button"
                onClick={updateName}
                disabled={savingName}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-bold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-5 w-5" />

                {savingName
                  ? "جاري حفظ الاسم..."
                  : "حفظ الاسم"}
              </button>

            </section>

            {/* =================================================
                Email
            ================================================= */}

            <section className="rounded-3xl border border-slate-700 bg-slate-900/60 p-6">

              <div className="mb-6 flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800">
                  <Mail className="h-6 w-6 text-slate-300" />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    البريد الإلكتروني
                  </h2>

                  <p className="text-sm text-slate-500">
                    البريد المرتبط بحسابك
                  </p>
                </div>

              </div>

              <input
                type="email"
                value={email}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-slate-500"
              />

              <p className="mt-2 text-xs text-slate-600">
                لا يمكن تغيير البريد الإلكتروني من هذه الصفحة.
              </p>

            </section>

            {/* =================================================
                Password
            ================================================= */}

            <section className="rounded-3xl border border-yellow-500/20 bg-slate-900/60 p-6">

              <div className="mb-6 flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10">
                  <Lock className="h-6 w-6 text-yellow-400" />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    تغيير كلمة المرور
                  </h2>

                  <p className="text-sm text-slate-500">
                    قم بتغيير كلمة مرور حسابك
                  </p>
                </div>

              </div>

              {/* Current Password */}

              <label className="mb-2 block text-sm font-bold text-slate-300">
                كلمة المرور الحالية
              </label>

              <div className="relative">

                <input
                  type={
                    showCurrentPassword
                      ? "text"
                      : "password"
                  }
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pl-12 text-white outline-none transition focus:border-yellow-500"
                  placeholder="كلمة المرور الحالية"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowCurrentPassword(
                      (prev) => !prev
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>

              </div>

              {/* New Password */}

              <label className="mb-2 mt-5 block text-sm font-bold text-slate-300">
                كلمة المرور الجديدة
              </label>

              <div className="relative">

                <input
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pl-12 text-white outline-none transition focus:border-yellow-500"
                  placeholder="كلمة المرور الجديدة"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowNewPassword(
                      (prev) => !prev
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>

              </div>

              {/* Confirm Password */}

              <label className="mb-2 mt-5 block text-sm font-bold text-slate-300">
                تأكيد كلمة المرور الجديدة
              </label>

              <div className="relative">

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 pl-12 text-white outline-none transition focus:border-yellow-500"
                  placeholder="أعد كتابة كلمة المرور الجديدة"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) => !prev
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>

              </div>

              <p className="mt-3 text-xs text-slate-600">
                كلمة المرور يجب أن تكون 6 أحرف على الأقل.
              </p>

              <button
                type="button"
                onClick={changePassword}
                disabled={changingPassword}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-600 py-3 font-bold text-white transition hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Lock className="h-5 w-5" />

                {changingPassword
                  ? "جاري تغيير كلمة المرور..."
                  : "تغيير كلمة المرور"}
              </button>

            </section>

          </div>

        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          BioPulse Learning Platform © 2027
        </p>

      </div>

      {/* =======================================================
          Image Preview
      ======================================================= */}

      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
        >
          <img
            src={previewImage}
            alt="الصورة الشخصية"
            className="max-h-[90vh] max-w-[90vw] rounded-2xl border-4 border-white object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

    </main>
  );
}