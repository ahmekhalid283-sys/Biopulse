"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function handleRegister() {
    if (!name || !phone || !email || !password || !confirmPassword) {
      alert("من فضلك املأ جميع البيانات");
      return;
    }

    if (password !== confirmPassword) {
      alert("كلمتا المرور غير متطابقتين");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    console.log("AUTH DATA:", data);
    console.log("AUTH ERROR:", error);



    if (error) {
      alert(error.message);
      return;
    }

    const { error: dbError } = await supabase.from("students").insert({
      full_name: name,
      phone: phone,
      password_hash: "supabase_auth",
    });

    if (dbError) {
    console.log(dbError);
    alert(dbError.message);
    return;
  }

    alert("تم إنشاء الحساب بنجاح 🎉");
  }


  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-4xl font-bold text-blue-600">
            BioPulse
          </CardTitle>

          <p className="text-center text-gray-500">
            إنشاء حساب جديد
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم بالكامل</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسمك بالكامل"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxxxx"
            />
          </div>
          



          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
            />
          </div>
          


          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
            />
          </div>


          <Button onClick={handleRegister}>
            إنشاء حساب
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}