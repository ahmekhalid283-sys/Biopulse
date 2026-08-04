import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ============================================================
// إعدادات لازم تتأكد منها / تعدلها حسب مشروعك
// ============================================================

// مسار صفحة تسجيل الدخول الفعلية عندك.
// في الكود اللي بعتهولي فيه تعارض: فيه مجلد /login وفيه router.replace("/auth")
// حط هنا المسار الصح اللي فعلاً موجود وشغال عندك.
const LOGIN_PATH = "/auth";

// أي مسار يبدأ بيهم ده يعتبر "منطقة طالب" ولازم يكون فيها student مسجل دخول
const STUDENT_PREFIXES = [
  "/dashboard",
  "/chapters",
  "/exam",
  "/exam-intro",
  "/lectures",
  "/results",
  "/review",
];

// أي مسار يبدأ بيهم ده يعتبر "منطقة أدمن" ولازم role = admin
const ADMIN_PREFIXES = ["/admin"];

// مسارات عامة مسموح الدخول عليها من غير تسجيل دخول
const PUBLIC_PATHS = ["/", "/auth", "/login", "/register", "/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // اسمح بمرور ملفات Next الداخلية والـ static assets وai لا تتعارض
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // ملفات زي .png .ico .css
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isStudentArea = STUDENT_PREFIXES.some((p) =>
    pathname.startsWith(p)
  );
  const isAdminArea = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));
  const isPublic = PUBLIC_PATHS.includes(pathname);

  // مش مسجل دخول وعايز يدخل منطقة محمية -> رجّعه لصفحة الدخول
  if (!user && (isStudentArea || isAdminArea)) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // مسجل دخول بالفعل وعايز يدخل صفحة تسجيل الدخول/تسجيل حساب -> رجّعه للداشبورد
  if (user && isPublic && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // ============================================================
  // فحص صلاحية الأدمن
  // ============================================================
  // مبني على جدول "admins" منفصل (id, auth_id, created_at) —
  // نفس الجدول اللي بيستخدمه LoginForm.tsx بالظبط.
  let isAdmin = false;

  if (user && (isAdminArea || isStudentArea)) {
    const { data: adminRow } = await supabase
      .from("admins")
      .select("id")
      .eq("auth_id", user.id)
      .maybeSingle();

    isAdmin = !!adminRow;
  }

  // مش أدمن وعايز يدخل منطقة الأدمن -> رجّعه لـ dashboard الطالب
  if (user && isAdminArea && !isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // أدمن وعايز يدخل منطقة الطالب -> رجّعه لـ /admin
  // (شيل الشرط ده لو عايز الأدمن يقدر يشوف واجهة الطالب برضه)
  if (user && isStudentArea && isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * طبّق الـ middleware على كل المسارات ماعدا:
     * - ملفات static (_next/static, _next/image)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};