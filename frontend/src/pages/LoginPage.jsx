import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import AuthMediaCarousel from "../components/AuthMediaCarousel";

// Minimal, two-column login page inspired by provided reference
const LoginPage = () => {
  const { login, isLoggingIn } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const validate = () => {
    const next = { email: "", password: "" };
    if (!formData.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
      next.email = "Invalid email";
    if (!formData.password) next.password = "Password is required";
    setErrors(next);
    return !next.email && !next.password;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    login({ ...formData, remember: rememberMe });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-b from-[#3c334b] to-[#2a2336] text-zinc-100 relative">
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-[0_8px_40px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/5 bg-[#1f1a27] flex flex-col md:flex-row">
        {/* Left media carousel */}
        <div className="relative md:w-1/2 hidden md:flex">
          <AuthMediaCarousel variant="login" />
          <div className="absolute top-4 left-5 text-xl font-semibold tracking-wide text-white/90 select-none">
            AMU
          </div>
        </div>

        {/* Right form panel */}
        <div className="md:w-1/2 w-full p-8 sm:p-12 bg-[#1f1a27]/95 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h1 className="text-3xl font-semibold tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-sm text-zinc-400 mb-8">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                className="text-violet-400 hover:text-violet-300 font-medium underline-offset-4 hover:underline"
              >
                Create one
              </Link>
            </p>
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2 text-zinc-300"
                >
                  Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                    className={`w-full h-12 rounded-xl bg-[#2a2434] border border-[#3b3346] focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40 outline-none pl-12 pr-4 text-sm placeholder:text-zinc-500 transition-colors ${
                      errors.email
                        ? "border-rose-400 focus:ring-rose-400/40 focus:border-rose-400"
                        : ""
                    }`}
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                {errors.email && (
                  <p
                    id="email-error"
                    className="mt-2 text-xs text-rose-400 font-medium"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2 text-zinc-300"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    className={`w-full h-12 rounded-xl bg-[#2a2434] border border-[#3b3346] focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40 outline-none pl-12 pr-12 text-sm placeholder:text-zinc-500 transition-colors ${
                      errors.password
                        ? "border-rose-400 focus:ring-rose-400/40 focus:border-rose-400"
                        : ""
                    }`}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="password-error"
                    className="mt-2 text-xs text-rose-400 font-medium"
                  >
                    {errors.password}
                  </p>
                )}
                <div className="flex items-center mt-3">
                  <label className="flex items-center gap-2 text-xs text-zinc-400 select-none">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs [--chkbg:#6d55e6] [--chkfg:#fff]"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      aria-checked={rememberMe}
                      aria-label="Remember me"
                    />
                    <span>Remember me</span>
                  </label>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-12 rounded-xl bg-violet-500 hover:bg-violet-400 active:bg-violet-500 disabled:opacity-60 font-medium text-white text-sm tracking-wide shadow-[0_4px_16px_-4px_rgba(109,85,230,0.55)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-400 focus:ring-offset-[#1f1a27] transition-colors"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isLoggingIn ? "Signing in..." : "Sign in"}
                </span>
              </button>
            </form>
            <p className="mt-8 text-[11px] leading-snug text-zinc-500 max-w-sm">
              By continuing you agree to our{" "}
              <span className="text-zinc-300">Terms</span> &{" "}
              <span className="text-zinc-300">Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
