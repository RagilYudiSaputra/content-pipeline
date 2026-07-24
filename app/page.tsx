"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
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

  const handleLogin = async () => {
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
    <main className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT */}

        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 p-16 text-white">

          <div>
            <div className="inline-flex rounded-xl bg-white/15 px-5 py-3 backdrop-blur">
              <span className="text-lg font-semibold">
                Content Pipeline CMS
              </span>
            </div>
          </div>

          <div>
            <h1 className="max-w-xl text-5xl font-bold leading-tight">
              Manage Your Content Publishing Workflow
            </h1>

            <p className="mt-6 max-w-lg text-lg text-blue-100">
              Create, organize, review, and publish your content faster
              through one integrated dashboard.
            </p>
          </div>

          <p className="text-sm text-blue-100">
            © 2026 Content Pipeline Management System
          </p>

        </div>

        {/* RIGHT */}

        <div className="flex items-center justify-center p-8">

          <Card className="w-full max-w-md border-0 shadow-xl">

            <CardContent className="p-8">

              <div className="mb-8">

                <h2 className="text-3xl font-bold">
                  Welcome Back
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Sign in to continue managing your content.
                </p>

              </div>

              <div className="space-y-5">

                {/* EMAIL */}

                <div className="space-y-2">

                  <Label>Email</Label>

                  <div className="relative">

                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      type="email"
                      placeholder="admin@email.com"
                      className="h-11 pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />

                  </div>

                </div>

                {/* PASSWORD */}

                <div className="space-y-2">

                  <Label>Password</Label>

                  <div className="relative">

                    <LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-11 pl-10 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleLogin();
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>

                  </div>

                </div>

                <Button
                  onClick={handleLogin}
                  disabled={loading}
                  className="h-11 w-full"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>

              </div>

            </CardContent>

          </Card>

        </div>

      </div>
    </main>
  );
}