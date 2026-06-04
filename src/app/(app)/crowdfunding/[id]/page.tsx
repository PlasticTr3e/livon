"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Badge, cn } from "@/components/ui/primitives";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { apiFetch } from "@/lib/api-client";
import {
  ArrowLeft,
  Target,
  TrendingUp,
  Shield,
  ChevronRight,
  HandCoins,
} from "lucide-react";

/**
 * Interface representing the detailed data of a crowdfunding project.
 */
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

/**
 * Fallback images for campaigns if none are provided by the API.
 */
const CAMPAIGN_IMAGES: Record<string, string[]> = {
  "2": [
    "https://images.unsplash.com/photo-1759702132600-731687499b41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ],
  default: [
    "https://images.unsplash.com/photo-1774697442958-283860cf8409?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ],
};

// ==========================================
// SUB-COMPONENTS
// ==========================================

/**
 * Renders the image gallery with previous/next navigation for a project.
 */
function ProjectImageGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () =>
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  return (
    <div className="md:col-span-2 h-64 md:h-[340px] w-full rounded-2xl overflow-hidden shadow-md relative group">
      <ImageWithFallback
        src={images[currentImageIndex]}
        alt={title}
        className="w-full h-full object-cover transition-all duration-500"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === currentImageIndex
                    ? "bg-white scale-125"
                    : "bg-white/50",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Renders the donation form allowing the user to select preset amounts or enter a custom one.
 */
function DonationForm({
  project,
  presetAmounts,
}: {
  project: ProjectData;
  presetAmounts: number[];
}) {
  const router = useRouter();
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const handlePresetClick = (amount: number) => {
    setSelectedPreset(amount);
    setCustomAmount(amount.toString());
  };

  const finalAmount = parseInt(customAmount || "0");

  const handleDonate = () => {
    if (!finalAmount || finalAmount < 10000) return;
    router.push(`/payment/${project.id}?amount=${finalAmount}`);
  };

  const canDonate = project.status?.toUpperCase() === "DISETUJUI";

  return (
    <Card className="p-6 border-2 border-green-200 shadow-md relative overflow-hidden">
      {!canDonate && (
        <div className="absolute inset-0 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
          <HandCoins className="w-12 h-12 text-gray-400 mb-3" />
          <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-1">
            Donation Not Available
          </h3>
          <p className="text-sm text-gray-600 dark:text-white">
            This campaign status is {project.status || "Unknown"}. Donations can
            only be made to projects with Funding (Approved) status.
          </p>
        </div>
      )}
      <h2 className="font-black text-gray-900 dark:text-white mb-5 flex items-center gap-2">
        <HandCoins className="w-5 h-5 text-green-600" /> Donation Amount
      </h2>
      <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2 uppercase tracking-wide">
        Quick Amount (Rp)
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {presetAmounts.map((amount) => (
          <button
            key={amount}
            onClick={() => handlePresetClick(amount)}
            className={cn(
              "h-14 rounded-xl font-bold text-sm border-2 transition-all",
              selectedPreset === amount
                ? "bg-green-600 border-green-600 text-white shadow-md ring-4 ring-green-100"
                : "bg-white dark:bg-[#1F2937] border-gray-200 dark:border-slate-600 text-gray-700 dark:text-white hover:border-green-300 hover:bg-green-50",
            )}
          >
            <span>Rp {amount.toLocaleString("id-ID")}</span>
          </button>
        ))}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-700 dark:text-white mb-2 uppercase tracking-wide">
          Other Amount (Rp)
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">
            Rp
          </span>
          <input
            type="number"
            placeholder="Enter amount..."
            className="w-full pl-12 pr-4 h-14 text-lg font-bold border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 bg-white dark:bg-[#1F2937] text-gray-900 dark:text-white transition-all"
            value={customAmount}
            min="10000"
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedPreset(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "-" || e.key === "e") {
                e.preventDefault();
              }
            }}
          />
        </div>
        {finalAmount > 0 && finalAmount < 10000 ? (
          <p className="text-xs text-red-500 mt-2 font-medium">
            Amount cannot be less than Rp 10.000
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-white mt-2">
            Minimum donation is Rp 10.000
          </p>
        )}
      </div>
      <button
        onClick={handleDonate}
        disabled={!finalAmount || finalAmount < 10000}
        className={cn(
          "w-full h-16 rounded-xl font-black uppercase tracking-widest text-lg transition-all flex items-center justify-center gap-3",
          finalAmount >= 10000
            ? "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            : "bg-gray-200 dark:bg-slate-700 text-gray-400 cursor-not-allowed",
        )}
      >
        {finalAmount >= 10000
          ? `Pay Donation Rp ${finalAmount.toLocaleString("id-ID")}`
          : "Pay Donation"}
      </button>
      <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400">
        <Shield className="w-3.5 h-3.5 text-green-500" />
        <span>Secure and encrypted payment • 100% Transparent</span>
      </div>
    </Card>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function CrowdfundingPage() {
  const { id } = useParams<{ id: string }>();

  // --- State Management ---
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Data Fetching ---
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
      <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] overflow-y-auto items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-300 dark:border-slate-600 border-t-green-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-white font-medium">
            Loading campaign...
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] overflow-y-auto items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-white font-medium">
            Campaign not found
          </p>
          <Link
            href="/crowdfunding"
            className="text-green-600 hover:text-green-700 mt-2 inline-block"
          >
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  // --- Data Preparation ---
  const target = project.budgetTarget || 0;
  const collected = project.currentFunding || 0;
  const progress =
    target > 0 ? Math.min(Math.round((collected / target) * 100), 100) : 0;
  const presetAmounts = [25000, 50000, 100000, 500000];
  const images =
    project.imageUrls && project.imageUrls.length > 0
      ? project.imageUrls
      : CAMPAIGN_IMAGES[project.id] || CAMPAIGN_IMAGES.default;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#0B1120] overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <Link
          href="/crowdfunding"
          className="flex items-center text-green-600 dark:text-green-400 hover:text-green-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium text-sm">Back to Menu</span>
        </Link>
        <Link
          href={`/project/${project.id}`}
          className="flex items-center text-green-600 dark:text-green-400 hover:text-green-800 transition-colors"
        >
          <span className="font-medium text-sm">View Project Details</span>
          <ChevronRight className="w-5 h-5 ml-1" />
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Project Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <ProjectImageGallery images={images} title={project.title} />

          <div className="md:col-span-3 space-y-4">
            <div>
              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 mb-2">
                {project.status?.toUpperCase() === "DISETUJUI"
                  ? "Active"
                  : project.status || "Active"}
              </Badge>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">
                {project.title}
              </h1>
            </div>
            <p className="text-sm text-gray-600 dark:text-white leading-relaxed line-clamp-3">
              {project.description}
            </p>

            {/* Project Stats (Collected & Target) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 flex justify-between items-center">
                <div className="text-left">
                  <p className="text-xs text-green-700 dark:text-green-400 font-semibold uppercase tracking-wider mb-1">
                    Collected
                  </p>
                  <p className="font-black text-green-800 dark:text-green-300 text-sm">
                    Rp {Number(collected).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="bg-white dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md p-1.5 shadow-sm">
                  <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 flex justify-between items-center">
                <div className="text-left">
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 font-semibold uppercase tracking-wider mb-1">
                    Target
                  </p>
                  <p className="font-black text-yellow-800 dark:text-yellow-300 text-sm">
                    Rp {Number(target).toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="bg-white dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-md p-1.5 shadow-sm">
                  <Target className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1.5">
                <span className="text-gray-600 dark:text-white">
                  Funding Progress
                </span>
                <span className="text-green-600">{progress}%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-yellow-400 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Donation Component */}
        <DonationForm project={project} presetAmounts={presetAmounts} />
      </div>
    </div>
  );
}
