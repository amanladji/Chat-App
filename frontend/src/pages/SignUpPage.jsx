import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import AuthMediaCarousel from "../components/AuthMediaCarousel";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Link as RouterLink } from "react-router-dom";

// Signup page styled to mirror the new simplified Login layout
const SignUpPage = () => {
  const { signup, isSigningUp } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });

  const validate = () => {
    if (!formData.fullName.trim()) return toast.error("Full name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return toast.error("Invalid email format");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 6) return toast.error("Password must be at least 6 characters");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) signup(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-b from-[#3c334b] to-[#2a2336] text-zinc-100 relative">
      <RouterLink to="/settings" className="absolute top-4 right-4 z-50 text-xs font-medium bg-white/10 hover:bg-white/15 text-white/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/15 transition-colors flex items-center gap-2">
        <span>Settings</span>
      </RouterLink>
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-[0_8px_40px_-8px_rgba(0,0,0,0.45)] ring-1 ring-white/5 bg-[#1f1a27] flex flex-col md:flex-row">
        {/* Left media carousel */}
        <div className="relative md:w-1/2 hidden md:flex">
          <AuthMediaCarousel variant="signup" />
          <div className="absolute top-4 left-5 text-xl font-semibold tracking-wide text-white/90 select-none">AMU</div>
        </div>

        {/* Right form panel */}
        <div className="md:w-1/2 w-full p-8 sm:p-12 bg-[#1f1a27]/95 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h1 className="text-3xl font-semibold tracking-tight mb-2">Create an account</h1>
            <p className="text-sm text-zinc-400 mb-8">
              Already have an account?{' '}
              <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium underline-offset-4 hover:underline">Sign in</Link>
            </p>
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Full name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-2 text-zinc-300">Full name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                    <User className="w-5 h-5" />
                  </span>
                  <input
                    id="fullName"
                    type="text"
                    required
                    className="w-full h-12 rounded-xl bg-[#2a2434] border border-[#3b3346] focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40 outline-none pl-12 pr-4 text-sm placeholder:text-zinc-500 transition-colors"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e)=>setFormData({...formData,fullName:e.target.value})}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2 text-zinc-300">Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    className="w-full h-12 rounded-xl bg-[#2a2434] border border-[#3b3346] focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40 outline-none pl-12 pr-4 text-sm placeholder:text-zinc-500 transition-colors"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e)=>setFormData({...formData,email:e.target.value})}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2 text-zinc-300">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-5 h-5" />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full h-12 rounded-xl bg-[#2a2434] border border-[#3b3346] focus:border-violet-400 focus:ring-2 focus:ring-violet-400/40 outline-none pl-12 pr-12 text-sm placeholder:text-zinc-500 transition-colors"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e)=>setFormData({...formData,password:e.target.value})}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={()=>setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-zinc-500">Must be at least 6 characters.</p>
              </div>

              <button
                type="submit"
                disabled={isSigningUp}
                className="w-full h-12 rounded-xl bg-violet-500 hover:bg-violet-400 active:bg-violet-500 disabled:opacity-60 font-medium text-white text-sm tracking-wide shadow-[0_4px_16px_-4px_rgba(109,85,230,0.55)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-400 focus:ring-offset-[#1f1a27] transition-colors"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  {isSigningUp && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSigningUp ? 'Creating account...' : 'Create account'}
                </span>
              </button>
            </form>
            <p className="mt-8 text-[11px] leading-snug text-zinc-500 max-w-sm">By continuing you agree to our <span className="text-zinc-300">Terms</span> & <span className="text-zinc-300">Privacy Policy</span>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
