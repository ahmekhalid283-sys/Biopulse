"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthCard() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="mx-auto w-full max-w-md">
        <div
        className="
            rounded-3xl
            border border-cyan-500/20
            bg-slate-900/60
            backdrop-blur-xl
            shadow-[0_0_60px_rgba(0,255,255,0.08)]
            p-8
        "
        >
        <AnimatePresence mode="wait">
            {mode === "login" ? (
            <motion.div
                key="login"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.35 }}
            >
                <LoginForm onSwitch={() => setMode("register")} />
            </motion.div>
            ) : (
            <motion.div
                key="register"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.35 }}
            >
                <RegisterForm onSwitch={() => setMode("login")} />
            </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
    );
  }
