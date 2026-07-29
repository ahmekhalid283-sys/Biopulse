"use client";

import Link from "next/link";
import { Bell, User } from "lucide-react";

type Props = {
  studentName: string;
};

export default function Navbar({ studentName }: Props) {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link
          href="/dashboard"
          className="text-2xl font-bold text-cyan-400"
        >
          BioPulse
        </Link>

        <div className="flex items-center gap-5">

          <button className="relative text-slate-300 hover:text-white transition">
            <Bell size={22} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500"></span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center">
              <User className="text-white" size={18} />
            </div>

            <div className="hidden md:block">
              <p className="text-sm text-slate-400">
                مرحباً
              </p>

              <p className="font-semibold text-white">
                {studentName}
              </p>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}