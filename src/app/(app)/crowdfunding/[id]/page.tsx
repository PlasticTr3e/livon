"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Badge, cn } from "@/components/ui/WireframePrimitives";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { apiFetch } from "@/lib/api-client";
import {
  ArrowLeft,
  Target,
  TrendingUp,
  Users,
  Clock,
  Shield,
  CreditCard,
  Smartphone,
  Building,
  ChevronRight,
  HandCoins,
} from "lucide-react";

interface ProjectData {
  id: string;
  title: string;
  description: string;
  budgetTarget: number;
  currentFunding?: number;
  imageUrls?: string[];
  status?: string;
  createdAt?: string;
}

interface Donor {
  id: string;
  name: string;
  amount: number;
  isAnonymous: boolean;
  message?: string;
  timestamp: string;
}

const CAMPAIGN_IMAGES: Record<string, string> = {
  "2": "https://images.unsplash.com/photo-1759702132600-731687499b41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  default:
    "https://images.unsplash.com/photo-1774697442958-283860cf8409?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
};

export default function CrowdfundingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch project data from API
  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("livon-token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await apiFetch<ProjectData>(`/api/projects/${id}`, {
          headers,
        });

        if (response.success && response.data) {
          setProject(response.data);
          // For now, set empty donors since donations endpoint not available
          // TODO: Add donations endpoint integration when available
          setDonors([]);
        }
      } catch (error) {
        console.error("Failed to fetch project:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProjectData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-300 dark:border-slate-600 border-t-green-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-slate-400 font-medium">
            Memuat kampanye...
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-slate-400 font-medium">
            Kampanye tidak ditemukan
          </p>
          <Link
            href="/crowdfunding"
            className="text-green-600 hover:text-green-700 mt-2 inline-block"
          >
            Kembali ke daftar kampanye
          </Link>
        </div>
      </div>
    );
  }

  const target = project.budgetTarget || 0;
  const collected = project.currentFunding || 0;
  const progress =
    target > 0 ? Math.min(Math.round((collected / target) * 100), 100) : 0;
  const daysLeft = 18;

  const presetAmounts = [25000, 50000, 100000, 500000];

  const handlePresetClick = (amount: number) => {
    setSelectedPreset(amount);
    setCustomAmount(amount.toString());
  };

  const finalAmount = parseInt(customAmount || "0");

  const handleDonate = () => {
    if (!finalAmount || finalAmount < 1000) return;
    router.push(
      `/payment/${project.id}?amount=${finalAmount}&anonymous=${isAnonymous}`,
    );
  };

  const imgSrc =
    project.imageUrls?.[0] ||
    CAMPAIGN_IMAGES[project.id] ||
    CAMPAIGN_IMAGES.default;
  const canDonate = project.status?.toUpperCase() === "DISETUJUI";

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link
          href={`/project/${project.id}`}
          className="flex items-center text-green-600 dark:text-green-400 hover:text-green-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium text-sm">Kembali ke Proyek</span>
        </Link>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Pembayaran Aman
          </span>
        </div>
      </div>

      <div className="max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-2 h-52 md:h-full rounded-2xl overflow-hidden shadow-md">
            <ImageWithFallback
              src={imgSrc}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="md:col-span-3 space-y-4">
            <div>
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 mb-2">
                🔥 {project.status || "Aktif"}
              </Badge>
              <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100 leading-tight">
                {project.title}
              </h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed line-clamp-3">
              {project.description}
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 text-center">
                <p className="text-xs text-green-700 dark:text-green-400 font-semibold uppercase tracking-wider mb-1">
                  <TrendingUp className="w-3 h-3 inline mr-0.5" />
                  Terkumpul
                </p>
                <p className="font-black text-green-800 dark:text-green-300 text-sm">
                  Rp {(collected / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 text-center">
                <p className="text-xs text-yellow-700 dark:text-yellow-400 font-semibold uppercase tracking-wider mb-1">
                  <Target className="w-3 h-3 inline mr-0.5" />
                  Target
                </p>
                <p className="font-black text-yellow-800 dark:text-yellow-300 text-sm">
                  Rp {(target / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-center">
                <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold uppercase tracking-wider mb-1">
                  <Clock className="w-3 h-3 inline mr-0.5" />
                  Sisa Waktu
                </p>
                <p className="font-black text-blue-800 dark:text-blue-300 text-sm">
                  {daysLeft} Hari
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1.5">
                <span className="text-gray-600 dark:text-slate-400">
                  Progress Pendanaan
                </span>
                <span className="text-green-600">{progress}%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-yellow-400 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                {donors.slice(0, 5).map((d) => (
                  <div
                    key={d.id}
                    className="w-6 h-6 rounded-full bg-green-100 border-2 border-white dark:border-slate-800 -ml-1.5 first:ml-0 flex items-center justify-center shadow-sm"
                  >
                    <span className="text-[10px] font-bold text-green-700">
                      {d.isAnonymous ? "?" : d.name.charAt(0)}
                    </span>
                  </div>
                ))}
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                  {donors.length} donatur
                </span>
              </div>
            </div>
          </div>
        </div>

        <Card className="p-6 border-2 border-green-200 shadow-md relative overflow-hidden">
          {!canDonate && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
              <HandCoins className="w-12 h-12 text-gray-400 mb-3" />
              <h3 className="font-bold text-gray-800 dark:text-slate-200 text-lg mb-1">
                Donasi Belum / Tidak Tersedia
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Kampanye ini berstatus {project.status || "Unknown"}. Donasi
                hanya dapat dilakukan pada proyek dengan status Funding
                (Disetujui).
              </p>
            </div>
          )}
          <h2 className="font-black text-gray-900 dark:text-slate-100 mb-5 flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-green-600" /> Pilih Jumlah Donasi
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handlePresetClick(amount)}
                className={cn(
                  "h-14 rounded-xl font-bold text-sm border-2 transition-all",
                  selectedPreset === amount
                    ? "bg-green-600 border-green-600 text-white shadow-md ring-4 ring-green-100"
                    : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-green-300 hover:bg-green-50",
                )}
              >
                <span className="block text-xs text-opacity-75 mb-0.5 opacity-70">
                  Rp
                </span>
                {amount >= 1000000
                  ? `${(amount / 1000000).toFixed(1)}jt`
                  : `${(amount / 1000).toFixed(0)}rb`}
              </button>
            ))}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
              Jumlah Lain (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
                Rp
              </span>
              <input
                type="number"
                placeholder="Masukkan jumlah..."
                className="w-full pl-12 pr-4 h-14 text-lg font-bold border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 transition-all"
                value={customAmount}
                min="1000"
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedPreset(null);
                }}
              />
            </div>
            {finalAmount > 0 && finalAmount < 1000 && (
              <p className="text-xs text-red-500 mt-1">
                Minimum donasi Rp 1.000
              </p>
            )}
          </div>
          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-100 dark:border-slate-600">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 accent-green-600 rounded"
              />
              <label
                htmlFor="anonymous"
                className="text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer"
              >
                Donasi secara anonim
              </label>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">
                Pesan untuk komunitas (opsional)
              </label>
              <textarea
                className="w-full p-3 border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm resize-none h-20 text-gray-800 dark:text-slate-200"
                placeholder="Tulis pesan dukungan Anda..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={handleDonate}
            disabled={!finalAmount || finalAmount < 1000}
            className={cn(
              "w-full h-16 rounded-xl font-black uppercase tracking-widest text-lg transition-all flex items-center justify-center gap-3",
              finalAmount >= 1000
                ? "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                : "bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed",
            )}
          >
            <HandCoins className="w-6 h-6" />
            {finalAmount >= 1000
              ? `Donasi Rp ${finalAmount.toLocaleString("id-ID")}`
              : "Pilih Jumlah Donasi"}
          </button>
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            <span>Pembayaran aman dan terenkripsi • Transparan 100%</span>
          </div>
        </Card>

        <Card className="p-5 border-green-100">
          <h3 className="font-bold text-gray-800 dark:text-slate-200 mb-4 text-sm flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-green-600" /> Metode Pembayaran
            Tersedia
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: CreditCard,
                label: "Kartu Kredit/Debit",
                desc: "Visa, Mastercard",
              },
              { icon: Smartphone, label: "E-Wallet", desc: "GoPay, OVO, DANA" },
              {
                icon: Building,
                label: "Transfer Bank",
                desc: "BCA, BNI, Mandiri",
              },
            ].map((method) => (
              <div
                key={method.label}
                className="flex flex-col items-center text-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl"
              >
                <method.icon className="w-6 h-6 text-green-600 dark:text-green-400 mb-1.5" />
                <p className="text-xs font-semibold text-gray-800 dark:text-slate-200">
                  {method.label}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">
                  {method.desc}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 border-green-100">
          <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" /> Donatur Terbaru
          </h3>
          {donors.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Jadilah yang pertama berdonasi!
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {donors.map((donor) => (
                <div
                  key={donor.id}
                  className="py-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0",
                        donor.isAnonymous
                          ? "bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600"
                          : "bg-green-100 border-green-200",
                      )}
                    >
                      <span className="text-sm font-bold text-green-700">
                        {donor.isAnonymous ? "?" : donor.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-slate-100 text-sm">
                        {donor.isAnonymous ? "Donatur Anonim" : donor.name}
                      </p>
                      {donor.message && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 italic">
                          &ldquo;{donor.message}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        {donor.timestamp}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200 font-bold px-3">
                    Rp {donor.amount.toLocaleString("id-ID")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex items-center justify-between">
          <Link
            href={`/project/${project.id}`}
            className="flex items-center gap-1.5 text-green-600 hover:text-green-800 text-sm font-medium transition-colors"
          >
            Lihat Detail Proyek <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/crowdfunding"
            className="flex items-center gap-1.5 text-gray-500 hover:text-green-600 text-sm font-medium transition-colors"
          >
            Kampanye Lainnya <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
