export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-blue-700">
          BioPulse
        </h1>

        <p className="mt-4 text-xl text-gray-700">
          منصة اختبارات الأحياء للثانوية العامة
        </p>

        <button className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-lg transition">
          ابدأ الآن
        </button>
      </div>
    </main>
  );
}