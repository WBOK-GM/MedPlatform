import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Building2, User } from "lucide-react";
import { doctorApi } from "../../lib/api";
import { useI18n } from "../../lib/i18n";

interface DoctorNavbarProfile {
  name?: string;
  images?: Array<{ url?: string }>;
}

export default function Navbar() {
  const router = useRouter();
  const { language, setLanguage, t } = useI18n();
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorNavbarProfile | null>(null);

  useEffect(() => {
    setIsAuth(!!localStorage.getItem("token"));
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    setUser(storedUser);

    if (storedUser?.role === "DOCTOR" && storedUser?.id) {
      doctorApi
        .get<DoctorNavbarProfile>(`/doctors/user/${storedUser.id}`)
        .then(({ data }) => setDoctorProfile(data))
        .catch(() => setDoctorProfile(null));
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const isActive = (path: string) => router.pathname === path;
  const linkClasses = (path: string) =>
    `rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 min-w-[100px] text-center ${
      isActive(path)
        ? "bg-brand-300/30 text-brand-800"
        : "text-secondary-graphite hover:bg-brand-300/20 hover:text-brand-900"
    }`;

  const doctorName = doctorProfile?.name || user?.name || user?.email?.split("@")[0] || t("navbar.doctorProfile");
  const doctorImageUrl = doctorProfile?.images?.[0]?.url;
  const doctorInitial = String(doctorName || "D").trim().charAt(0).toUpperCase() || "D";

  return (
    <nav className="sticky top-0 z-[200] flex h-16 items-center justify-between border-b border-brand-300/45 bg-white/75 px-8 backdrop-blur-xl">
      <Link
        href={isAuth ? "/dashboard" : "/"}
        className="flex items-center gap-2 text-lg font-extrabold tracking-[-0.02em] text-transparent bg-gradient-to-r from-brand-800 to-brand-700 bg-clip-text"
      >
        <Building2 size={24} /> Encuentra a tu medico
      </Link>

      <div className="flex items-center gap-2">
        <div className="flex items-center overflow-hidden rounded-xl border border-brand-300/60 bg-white/90">
          <button
            type="button"
            onClick={() => setLanguage("es")}
            className={`px-2.5 py-1 text-xs font-bold transition-all duration-200 ${language === "es" ? "bg-brand-700 text-white" : "text-brand-900 hover:bg-brand-300/25"} cursor-pointer`}
          >
            {t("navbar.langEs")}
          </button>
          <button
            type="button"
            onClick={() => setLanguage("en")}
            className={`px-2.5 py-1 text-xs font-bold transition-all duration-200 ${language === "en" ? "bg-brand-700 text-white" : "text-brand-900 hover:bg-brand-300/25"} cursor-pointer`}
          >
            {t("navbar.langEn")}
          </button>
        </div>

        {isAuth ? (
          <>
            {user?.role === "DOCTOR" ? (
              <>
                <Link
                  href="/doctor/profile"
                  className={linkClasses("/doctor/profile") + " flex min-w-[180px] items-center justify-start gap-2.5"}
                >
                  {doctorImageUrl ? (
                    <img
                      src={doctorImageUrl}
                      alt={doctorName}
                      className="h-7 w-7 rounded-full border border-brand-300/60 object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-300/60 bg-brand-300/25 text-xs font-bold text-brand-900">
                      {doctorInitial}
                    </span>
                  )}
                  <span className="max-w-[140px] truncate">{doctorName}</span>
                </Link>
                <Link
                  href="/doctor/dashboard"
                  className={linkClasses("/doctor/dashboard")}
                >
                  {t("navbar.portal")}
                </Link>
                <Link
                  href="/doctor/history"
                  className={linkClasses("/doctor/history")}
                >
                  {t("navbar.history")}
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className={linkClasses("/dashboard")}>
                  {t("navbar.dashboard")}
                </Link>
                <Link href="/doctors" className={linkClasses("/doctors")}>
                  {t("navbar.doctors")}
                </Link>
              </>
            )}

            <button
              className="rounded-xl border border-[#c53d3d]/40 px-3.5 py-2 text-sm font-medium text-[#9b2f2f] transition-all duration-200 hover:bg-[#c53d3d]/10 cursor-pointer"
              onClick={logout}
            >
              {t("navbar.logout")}
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className={linkClasses("/login")}>
              {t("navbar.login")}
            </Link>
            <Link href="/register" className={linkClasses("/register")}>
              {t("navbar.register")}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
