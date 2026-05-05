"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, MapPin, Users, Leaf } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const prefilledEmail = searchParams.get("email") || "";
  const prefilledName = searchParams.get("name") || "";

  const images = [
    {
      src: "https://images.unsplash.com/photo-1749018883387-872e5b033a7d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
      alt: "Community development",
    },
    {
      src: "https://images.unsplash.com/photo-1577416412292-747c6607f055?q=80&w=1080&auto=format&fit=crop",
      alt: "Modern infrastructure",
    },
    {
      src: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1080&auto=format&fit=crop",
      alt: "Safe neighborhood",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  const [formData, setFormData] = useState(() => ({
    fullName: prefilledName,
    email: prefilledEmail,
    password: "",
    confirmPassword: "",
    nomorKK: "",
    nik: "",
    blokRumah: "",
    noRumah: "",
    role: "WARGA",
    agencyName: "",
    address: "",
    phone: "",
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, val: string) =>
    setFormData((prev) => ({ ...prev, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.fullName.trim()) e.fullName = "Full name is required";
    if (!formData.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Email is invalid";

    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 6)
      e.password = "Password must be at least 6 characters";

    if (formData.password !== formData.confirmPassword)
      e.confirmPassword = "Passwords do not match";

    if (!formData.phone.trim()) e.phone = "Phone is required";
    else if (!/^\d{10,12}$/.test(formData.phone.trim()))
      e.phone = "Phone number must be 10-12 digits";

    // Validate role-specific fields
    if (formData.role === "WARGA") {
      if (!formData.nomorKK.trim())
        e.nomorKK = "Family Card Number is required";
      else if (!/^\d{16}$/.test(formData.nomorKK.trim()))
        e.nomorKK = "Family Card Number must be 16 digits";

      if (formData.nik && !/^\d{16}$/.test(formData.nik.trim()))
        e.nik = "NIK must be 16 digits";

      if (!formData.blokRumah.trim()) e.blokRumah = "Block is required";
      if (!formData.noRumah.trim()) e.noRumah = "House Number is required";
    } else if (formData.role === "AGENCY") {
      if (!formData.agencyName.trim()) e.agencyName = "Agency name is required";
      if (!formData.address.trim()) e.address = "Address is required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    console.log("SUBMIT REGISTER CLICKED");
    e.preventDefault();
    if (validate()) {
      console.log("VALIDATION PASSED, MAU FETCH");
      try {
        console.log("SEBELUM FETCH");
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            role: formData.role,
            fullName: formData.fullName,
            phone: formData.phone,
            kkNumber: formData.nomorKK, // tetap kirim sebagai kkNumber
            nik: formData.nik,
            blockHouse: formData.blokRumah, // blokRumah -> blockHouse
            houseNumber: formData.noRumah, // noRumah -> houseNumber
            agencyName: formData.agencyName,
            address: formData.address,
          }),
        });
        console.log("SESUDAH FETCH");
        console.log("REGISTER RESPONSE", response);
        const result = await response.json();
        console.log("REGISTER RESULT", result);

        if (!response.ok) {
          // Tampilkan pesan error backend ke user
          setErrors({
            ...errors,
            general: result.message || result.error || "Registration failed",
          });
          return;
        }

        router.push("/auth/login?registered=true");
      } catch (err) {
        setErrors({ ...errors, general: "Network error" });
        console.error("REGISTER ERROR", err);
      }
    } else {
      console.log("VALIDATION FAILED");
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-950">
      {/* LEFT SIDE – Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-10 py-10 bg-white dark:bg-slate-900 overflow-y-auto">
        <div className="w-full max-w-[340px] mx-auto">
          <div className="lg:hidden mb-6 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-md flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent tracking-widest text-sm">
              LIVON
            </span>
          </div>

          <h1 className="text-[2.4rem] font-extrabold text-gray-900 dark:text-slate-100 leading-tight mb-2">
            Join Now!
          </h1>
          <p className="text-gray-400 dark:text-slate-500 text-sm leading-relaxed mb-6">
            Join your neighborhood community on LIVON.
            <br />
          </p>

          <form onSubmit={handleRegister} className="flex flex-col gap-3">
            {/* Full name */}
            <div>
              <input
                type="text"
                placeholder="Full name"
                value={formData.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                className="w-full h-12 px-5 rounded-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
              {errors.fullName && (
                <p className="text-red-500 text-[11px] pl-4 mt-1">
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email address */}
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => set("email", e.target.value)}
                readOnly={!!prefilledEmail}
                className={`w-full h-12 px-5 rounded-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 ${prefilledEmail ? "opacity-70 cursor-not-allowed" : ""}`}
              />
              {errors.email && (
                <p className="text-red-500 text-[11px] pl-4 mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => set("password", e.target.value)}
                  className="w-full h-12 px-5 pr-12 rounded-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-[11px] pl-4 mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  className="w-full h-12 px-5 pr-12 rounded-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-[11px] pl-4 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="w-full h-12 px-5 rounded-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                required
              />
              {errors.phone && (
                <p className="text-red-500 text-[11px] pl-4 mt-1">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                Role
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="WARGA"
                    checked={formData.role === "WARGA"}
                    onChange={(e) => set("role", e.target.value)}
                    className="mr-2"
                  />
                  Resident
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="AGENCY"
                    checked={formData.role === "AGENCY"}
                    onChange={(e) => set("role", e.target.value)}
                    className="mr-2"
                  />
                  Agency
                </label>
              </div>
            </div>

            {/* Database-specific fields - Warga */}
            {formData.role === "WARGA" && (
              <>
                <div>
                  <input
                    type="text"
                    placeholder="Family Card Number (16 digits)"
                    value={formData.nomorKK}
                    onChange={(e) => set("nomorKK", e.target.value)}
                    className="w-full h-12 px-5 rounded-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
                  />
                  {errors.nomorKK && (
                    <p className="text-red-500 text-[11px] pl-4 mt-1">
                      {errors.nomorKK}
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="NIK (16 digits, optional)"
                    value={formData.nik}
                    onChange={(e) => set("nik", e.target.value)}
                    className="w-full h-12 px-5 rounded-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                  {errors.nik && (
                    <p className="text-red-500 text-[11px] pl-4 mt-1">
                      {errors.nik}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Block"
                      value={formData.blokRumah}
                      onChange={(e) => set("blokRumah", e.target.value)}
                      className="w-full h-12 px-5 rounded-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    {errors.blokRumah && (
                      <p className="text-red-500 text-[11px] pl-4 mt-1">
                        {errors.blokRumah}
                      </p>
                    )}
                  </div>
                  <div className="w-28">
                    <input
                      type="text"
                      placeholder="House Number"
                      value={formData.noRumah}
                      onChange={(e) => set("noRumah", e.target.value)}
                      className="w-full h-12 px-5 rounded-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                    {errors.noRumah && (
                      <p className="text-red-500 text-[11px] pl-2 mt-1">
                        {errors.noRumah}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Database-specific fields - Agency */}
            {formData.role === "AGENCY" && (
              <>
                <input
                  type="text"
                  placeholder="Agency Name"
                  value={formData.agencyName || ""}
                  onChange={(e) => set("agencyName", e.target.value)}
                  className="w-full h-12 px-5 rounded-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.address || ""}
                  onChange={(e) => set("address", e.target.value)}
                  className="w-full h-12 px-5 rounded-full border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm text-gray-800 dark:text-slate-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                />
              </>
            )}
            <button
              type="submit"
              className="w-full h-12 bg-green-600 text-white rounded-full font-semibold text-sm hover:bg-green-700 transition-colors mt-1 shadow-sm"
            >
              Register
            </button>

            {errors.general && (
              <p className="text-red-500 text-sm text-center mt-2">
                {errors.general}
              </p>
            )}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
              <span className="text-xs text-gray-400 whitespace-nowrap">
                or continue with
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
            </div>
            <a
              href="/api/auth/google"
              className="w-full h-12 flex items-center justify-center gap-3 rounded-full border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-green-50 hover:border-green-300 transition-colors"
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
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                Continue with Google
              </span>
            </a>
            <p className="text-center text-xs text-gray-400 mt-1">
              Already have an account?{" "}
              <Link
                href="./login"
                className="font-semibold text-green-600 hover:underline"
              >
                Login
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
