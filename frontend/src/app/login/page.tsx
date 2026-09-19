"use client";

import { useState, FormEvent, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

function PersonIcon() {
  return (
    <svg
      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10z" />
      <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
    </svg>
  );
}

function VisibilityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  );
}

function VisibilityOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError("Email atau password salah");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Kunci total scrolling browser di level body & html saat berada di halaman login
    const origHtmlOverflow = document.documentElement.style.overflow;
    const origBodyOverflow = document.body.style.overflow;
    const origBodyPosition = document.body.style.position;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";

    return () => {
      document.documentElement.style.overflow = origHtmlOverflow;
      document.body.style.overflow = origBodyOverflow;
      document.body.style.position = origBodyPosition;
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, []);

  // Input 16px di mobile agar iOS tidak auto-zoom saat fokus
  const kelasInput =
    "w-full pl-12 pr-4 py-2.5 sm:py-3.5 bg-gray-50/50 border border-gray-200 rounded-full text-base sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all shadow-sm";

  return (
    <div className="fixed inset-0 w-full h-full bg-gray-100 flex items-center justify-center p-3 sm:p-6 md:p-10 overflow-hidden overscroll-none select-none z-50">
      <main className="w-full max-w-5xl z-10 flex md:h-[600px] max-h-full bg-white rounded-2xl shadow-2xl overflow-hidden relative">
        {/* Panel kiri: latar gradien & branding (desktop saja) */}
        <div className="hidden md:flex flex-col justify-center items-start w-1/2 bg-linear-to-br from-teal-800 to-teal-500 text-white p-10 xl:p-12 relative overflow-hidden">
          <div className="absolute -top-[25%] -left-[10%] w-[300px] h-[300px] rounded-full bg-white/10 blur-[40px]" />
          <div className="absolute -bottom-10 right-[20%] w-[250px] h-[250px] rounded-full bg-white/15 blur-[50px]" />
          <div
            className="absolute top-12 right-12 w-24 h-24"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.3) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
          <div className="absolute top-12 left-12 w-6 h-6 border-t-2 border-l-2 border-white/40" />
          <div className="absolute bottom-12 right-12 w-6 h-6 border-b-2 border-r-2 border-white/40" />

          <div className="relative">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden shrink-0">
                <img
                  alt="Logo SMP Plus YPP Darussurur"
                  src="/drs.png"
                  className="w-full h-full object-contain p-2"
                />
              </div>
              <h2 className="text-2xl font-semibold">SIPP Darussurur</h2>
            </div>
            <h1 className="text-3xl xl:text-[40px] leading-tight font-bold mb-4 tracking-tight">
              Selamat
              <br />
              Datang Kembali!
            </h1>
            <p className="text-white/80 max-w-[80%]">
              Sistem Informasi Pembelajaran Pesantren. Silakan masuk untuk
              mengakses akun Anda.
            </p>
          </div>
        </div>

        {/* Panel kanan: form login */}
        <div className="w-full md:w-1/2 flex flex-col justify-between p-5 sm:p-10 md:p-12 lg:p-16 bg-white relative overflow-hidden">
          <div className="w-full max-w-sm mx-auto flex flex-col flex-1 justify-center my-auto">
            {/* Branding mobile */}
            <div className="mb-4 md:hidden">
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="w-10 h-10 bg-gray-50 rounded-full border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    alt="Logo SIPP"
                    src="/drs.png"
                    className="w-full h-full object-contain p-1.5"
                  />
                </div>
                <div>
                  <span className="text-base font-bold text-teal-900 block leading-tight">
                    SIPP Darussurur
                  </span>
                  <span className="text-[11px] text-gray-400">
                    SMP Plus YPP Darussurur
                  </span>
                </div>
              </div>
              <div className="h-1 w-12 rounded-full bg-linear-to-r from-teal-800 to-teal-500" />
            </div>

            <h2 className="text-xl sm:text-3xl text-gray-900 mb-3.5 sm:mb-8 font-bold">
              Masuk
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-5">
              {error && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="relative">
                <PersonIcon />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email atau username"
                  autoComplete="email"
                  inputMode="email"
                  required
                  className={kelasInput}
                />
              </div>

              <div className="relative">
                <LockIcon />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  className={`${kelasInput} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors focus:outline-none cursor-pointer"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </button>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 justify-between items-center my-0.5 sm:my-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 bg-white transition-colors"
                  />
                  <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                    Ingat Saya
                  </span>
                </label>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-xs text-gray-500 hover:text-teal-600 transition-colors"
                >
                  Lupa Password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-3.5 px-4 bg-linear-to-r from-teal-800 to-teal-500 text-white rounded-full text-base sm:text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-teal-500/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  "Masuk Ke Sistem"
                )}
              </button>
            </form>
          </div>

          <div className="mt-2.5 sm:mt-6 text-center text-gray-400 text-[11px] sm:text-xs shrink-0">
            © 2026 SIPP Darussurur. Versi 1.0.0
          </div>
        </div>
      </main>
    </div>
  );
}
