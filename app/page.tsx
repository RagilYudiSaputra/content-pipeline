"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

import { login } from "@/services/auth.service";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Email dan password wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-600 lg:bg-none lg:bg-slate-50">
      {/* Background Glow Effect (Mobile & Desktop) */}
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none" />

      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT COLUMN (DESKTOP ONLY) */}
        <div className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 text-white bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-600">
          {/* Header/Logo */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur-md border border-white/20 shadow-xs">
              <Sparkles className="h-4 w-4 text-cyan-200" />
              <span className="text-sm font-semibold tracking-wide">
                Content Pipeline CMS
              </span>
            </div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 my-auto py-12">
            <h1 className="max-w-xl text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              Manage Your Content Publishing Workflow
            </h1>

            <p className="mt-5 max-w-lg text-base xl:text-lg text-blue-100/90 leading-relaxed">
              Create, organize, review, and publish your content faster
              through one integrated dashboard.
            </p>
          </div>

          {/* Footer */}
          <div className="relative z-10">
            <p className="text-xs text-blue-100/80">
              © 2026 Content Pipeline Management System. All rights reserved.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN (FORM ON MOBILE & DESKTOP) */}
        <div className="relative z-10 flex items-center justify-center p-4 sm:p-8 lg:p-12 lg:bg-slate-50/50">
          <Card className="w-full max-w-md border-0 sm:border border-slate-100 shadow-2xl sm:shadow-xl rounded-3xl bg-white/95 backdrop-blur-md lg:bg-white">
            <CardContent className="p-6 sm:p-8">
              {/* Header Badge Mobile */}
              <div className="lg:hidden mb-6 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-blue-500/10 px-4 py-2 text-blue-600 border border-blue-200/50">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-semibold tracking-wide">
                    Content Pipeline CMS
                  </span>
                </div>
              </div>

              {/* Title Section */}
              <div className="mb-6 sm:mb-8 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Welcome Back
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
                  Sign in to continue managing your content.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                {/* EMAIL */}
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium text-slate-700">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="email"
                      required
                      placeholder="admin@email.com"
                      className="h-11 pl-10 text-xs sm:text-sm rounded-xl border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="space-y-1.5">
                  <Label className="text-xs sm:text-sm font-medium text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      className="h-11 pl-10 pr-10 text-xs sm:text-sm rounded-xl border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm font-medium transition-all shadow-md shadow-blue-500/20"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Signing In...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Footer Mobile */}
              <div className="mt-8 text-center lg:hidden">
                <p className="text-[11px] text-slate-400">
                  © 2026 Content Pipeline Management System
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}