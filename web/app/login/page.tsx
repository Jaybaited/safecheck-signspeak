"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api";
import Link from "next/link";
import { Lock, User, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await login(username, password);
      localStorage.setItem("token", res.accessToken);
      localStorage.setItem("user", JSON.stringify(res.user));

      // Role-based routing
      const role = res.user.role;
      if (role === "ADMIN")        router.push("/admin/dashboard");
      else if (role === "STUDENT") router.push("/student/dashboard");
      else if (role === "TEACHER") router.push("/teacher/dashboard");
      else if (role === "PARENT")  router.push("/parent/dashboard");
      else                         router.push("/admin/dashboard");

    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F23] text-[#FAFAFA] flex flex-col">

      {/* Noise texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "300px 300px",
        }}
      />

      {/* Back to home */}
      <div className="relative z-10 px-6 md:px-12 py-5 border-b-2 border-[#2D2B5E]">
        <Link href="/" className="flex items-center gap-4 w-fit">
          <div className="w-10 h-10 border-2 border-[#8B5CF6] flex items-center justify-center">
            <span className="text-[#8B5CF6] text-sm font-bold tracking-tighter uppercase">SS</span>
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-[#FAFAFA] text-xs font-bold uppercase tracking-widest">SafeCheck</span>
            <span className="text-[#8B5CF6] text-xs font-bold uppercase tracking-widest">SignSpeak</span>
          </div>
        </Link>
      </div>

      {/* Login content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="mb-12">
            <span className="text-xs uppercase tracking-widest text-[#8B5CF6] font-bold">
              Welcome Back
            </span>
            <h1
              className="font-bold uppercase leading-none tracking-tighter text-[#FAFAFA] mt-3"
              style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)" }}
            >
              SIGN<br />
              <span className="text-[#8B5CF6]">IN</span>
            </h1>
            <p className="text-[#9CA3C8] text-base mt-4 leading-tight">
              Philippine School for the Deaf — Staff & Student Portal
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-8 p-4 border-2 border-red-500/50 bg-red-500/10 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-[#9CA3C8] font-bold flex items-center gap-2">
                <User className="w-3 h-3" />
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full h-14 bg-transparent border-b-2 border-[#2D2B5E] text-[#FAFAFA] text-lg font-medium px-0 placeholder:text-[#2D2B5E] focus:outline-none focus:border-[#8B5CF6] transition-colors duration-200"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-[#9CA3C8] font-bold flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-14 bg-transparent border-b-2 border-[#2D2B5E] text-[#FAFAFA] text-lg font-medium px-0 placeholder:text-[#2D2B5E] focus:outline-none focus:border-[#8B5CF6] transition-colors duration-200"
              />
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#8B5CF6] text-white text-sm font-bold uppercase tracking-widest flex items-center justify-center hover:bg-[#7C3AED] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />
                    Signing In...
                  </span>
                ) : (
                  "Sign In →"
                )}
              </button>
            </div>
          </form>

          {/* Footer note */}
          <p className="text-center text-[#2D2B5E] text-xs uppercase tracking-widest mt-12">
            SafeCheck · SignSpeak v1.0
          </p>
        </div>
      </div>

      {/* Decorative BG text */}
      <div
        aria-hidden="true"
        className="fixed bottom-0 right-0 text-[#1A1A3E] font-bold leading-none tracking-tighter select-none pointer-events-none z-0"
        style={{ fontSize: "clamp(6rem, 20vw, 18rem)" }}
      >
        PSD
      </div>
    </div>
  );
}
