"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Swords,
} from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
    { href: "/chapters", label: "الفصول", icon: BookOpen },
    { href: "/challenges", label: "التحديات", icon: Swords },
    { href: "/results", label: "النتائج", icon: Trophy },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950 lg:hidden">
      <div className="grid h-16 grid-cols-4">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center text-xs transition ${
                active ? "text-cyan-400" : "text-slate-400 hover:text-white"
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