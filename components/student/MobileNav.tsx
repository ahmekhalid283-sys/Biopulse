"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
} from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const links = [
    {
      href: "/dashboard",
      label: "الرئيسية",
      icon: LayoutDashboard,
    },
    {
      href: "/chapters",
      label: "الفصول",
      icon: BookOpen,
    },
    {
      href: "/results",
      label: "النتائج",
      icon: Trophy,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-slate-950 border-t border-slate-800 z-50">
      <div className="grid grid-cols-3 h-16">
        {links.map((link) => {
          const Icon = link.icon;

          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center text-xs transition ${
                active
                  ? "text-cyan-400"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span className="mt-1">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}