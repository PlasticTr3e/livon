"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Leaf, Sun, Moon } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useTheme } from "@/context/ThemeContext";
import { apiFetchJson } from "@/lib/api-client";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useState, useEffect } from "react";
import { useQueryState, parseAsString } from "nuqs";

interface LoginResponse {
  token: string;
  user: {
    email: string;
    name?: string | null;
    role?: string | null;
  };
}

export function LoginForm() {
  const router = useRouter();
  const { login } = useUser();
  const { theme, toggleTheme } = useTheme();

  const [registered, setRegistered] = useQueryState(
    "registered",
    parseAsString,
  );
  const [verified, setVerified] = useQueryState("verified", parseAsString);

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (registered === "true") {
      setSuccessMsg(
        "Your registration has been successfully submitted. To access the application, your account must be verified by the LIVON admin first. Estimated verification time is 2-3 business days.",
      );
      setRegistered(null);
    } else if (verified === "true") {
      setSuccessMsg(
        "Your email has been successfully verified! Please log in with your account.",
      );
      setVerified(null);
    }
  }, [registered, verified, setRegistered, setVerified]);

  const images = [
    {
      src: "https://images.unsplash.com/photo-1749018883387-872e5b033a7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      alt: "Community development",
    },
    {
      src: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      alt: "Modern city infrastructure",
    },
    {
      src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      alt: "Urban planning and development",
    },
  ];

  // Auto-change images every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      const result = await apiFetchJson<typeof formData, LoginResponse>(
        "/api/auth/login",
        "POST",
        formData,
      );

      if (!result.success || !result.data) {
        setError(result.message || "Login failed");
        return;
      }

      // Save token
      localStorage.setItem("livon-token", result.data.token);

      // Update user context with mapped role
      const apiRole = result.data.user.role;
      const mappedRole: "Resident" | "Manager" | "Admin" =
        apiRole === "ADMIN"
          ? "Admin"
          : apiRole === "AGENCY"
            ? "Manager"
            : "Resident";

      const userName = result.data.user.name || result.data.user.email;
      login(mappedRole, userName);

      // Redirect based on role
      if (mappedRole === "Admin" || mappedRole === "Manager") {
        router.push("/admin/users");
      } else {
        router.push("/map");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0B1120]">
      {/* ── LEFT SIDE – Form ── */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-10 py-16 bg-white dark:bg-[#111827] relative">
        {/* Dark mode toggle */}
        <button
          suppressHydrationWarning
          onClick={toggleTheme}
          className="absolute top-6 right-6 p-2 rounded-full text-gray-400 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-yellow-400" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        <div className="w-full max-w-85 mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-br from-green-500 to-green-700 rounded-md flex items-center justify-center shadow-sm">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-black bg-linear-to-r from-green-600 to-green-800 bg-clip-text text-transparent tracking-widest text-sm">
              LIVON
            </span>
          </div>

          <h1 className="text-[2.2rem] font-extrabold text-gray-900 dark:text-white leading-tight mb-2">
            Welcome!
          </h1>
          <p className="text-gray-400 dark:text-white text-sm leading-relaxed mb-6">
            Log in to LIVON and help make your neighborhood
            <br />
            even better!
          </p>

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300 rounded-lg text-sm animate-fade-in">
              <div className="font-bold mb-1 flex items-center justify-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Registration Successful!
              </div>
              <p className="text-center">{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full h-12 px-5 rounded-full border border-gray-200 dark:border-gray-800 bg-slate-50 dark:bg-[#1F2937] text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-colors"
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full h-12 px-5 pr-12 rounded-full border border-gray-200 dark:border-gray-800 bg-slate-50 dark:bg-[#1F2937] text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white hover:text-green-600 dark:hover:text-green-400 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="text-right -mt-1">
              <Link
                href="/forgot-password"
                className="text-xs text-gray-400 dark:text-white hover:text-green-600 dark:hover:text-green-400 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-full font-bold text-base shadow-sm shadow-green-200 dark:shadow-green-900 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all mt-1 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Logging in...
                </>
              ) : (
                "Log In"
              )}
            </button>
            {error && (
              <p className="text-red-500 text-sm text-center mt-2">{error}</p>
            )}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
              <span className="text-xs text-gray-400 dark:text-white whitespace-nowrap">
                or continue with
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
            </div>

            <a
              href="/api/auth/google"
              className="w-full h-12 flex items-center justify-center gap-3 rounded-full border-2 border-gray-200 bg-white text-gray-800 font-bold hover:bg-gray-50 hover:border-green-400 transition-colors"
              style={{ textDecoration: "none" }}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-sm font-medium">Continue with Google</span>
            </a>

            <p className="text-center text-xs text-gray-400 dark:text-white mt-2">
              Don&apos;t have an account?{" "}
              <Link
                href="./register"
                className="font-semibold text-green-600 dark:text-green-400 hover:underline"
              >
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE – Branding */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-green-600 to-green-800 relative overflow-hidden flex-col items-center justify-center p-14">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        ></div>
        <div className="absolute top-8 right-10 flex items-center gap-2">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-white text-sm tracking-[0.18em]">
            LIVON
          </span>
        </div>
        <div className="w-72 h-72 rounded-3xl overflow-hidden border-4 border-white/30 shadow-2xl relative transition-all duration-700 group hover:scale-105">
          <ImageWithFallback
            key={currentImageIndex} // forces re-render for fading
            src={images[currentImageIndex].src}
            alt={images[currentImageIndex].alt}
            className="w-full h-full object-cover animate-fade-in"
          />
        </div>
        <div className="mt-8 text-center relative z-10">
          <p className="text-white font-bold text-xl max-w-xs leading-snug">
            Make your neighborhood more
            <br />
            <span className="text-yellow-300 animate-pulse inline-block">
              transparent & organized
            </span>
          </p>
          <div className="flex justify-center gap-2 mt-4">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  index === currentImageIndex
                    ? "bg-yellow-400 w-4"
                    : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
