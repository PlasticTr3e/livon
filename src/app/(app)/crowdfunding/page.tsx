"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge, Button, Card, cn } from "@/components/ui/WireframePrimitives";
import Image from "next/image";
import { apiFetch } from "@/lib/api-client";
import {
  HandCoins,
  Search,
  CheckCircle2,
  Zap,
  Star,
  Clock,
} from "lucide-react";

interface ProjectFromDB {
  id: string;
  title: string;
  description: string;
  status?: string;
  budgetTarget?: number;
  currentFunding?: number;
  imageUrls?: string[];
}

const CAMPAIGN_IMAGES: Record<string, string> = {
  default:
    "https://images.unsplash.com/photo-1774697442958-283860cf8409?w=800&h=600&fit=crop",
};

export default function CrowdfundingListPage() {
  const [projects, setProjects] = useState<ProjectFromDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("livon-token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await apiFetch<ProjectFromDB[]>("/api/projects", {
          headers,
        });

        if (response.success && response.data) {
          setProjects(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Projects that accept crowdfunding: Based on status
  const fundingProjects = projects.filter(
    (p) => p.status && p.status.toUpperCase() === "DISETUJUI",
  );

  // All projects with funding collected
  const completedFundedProjects = projects.filter(
    (p) => p.status?.toUpperCase() === "SELESAI",
  );

  // Stats
  // const totalCollected = projects.reduce((sum, p) => sum + (p.currentFunding || 0), 0);
  // const totalDonors = fundingProjects.length * 12; // Estimate based on active projects

  const filteredActive = fundingProjects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredCompleted = completedFundedProjects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 w-full space-y-8">
        {/* Search + Tabs */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex gap-1 bg-white rounded-xl border border-green-100 p-1 shadow-sm">
            {[
              {
                key: "active",
                label: "Aktif",
                icon: Zap,
                count: fundingProjects.length,
              },
              {
                key: "completed",
                label: "Selesai",
                icon: CheckCircle2,
                count: completedFundedProjects.length,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as "active" | "completed")}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                  activeTab === tab.key
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-green-700 hover:bg-green-50",
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                    activeTab === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-500",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kampanye..."
              className="w-full pl-9 pr-4 py-2 border border-green-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Active Campaigns */}
        {activeTab === "active" && (
          <>
            {loading ? (
              <div className="text-center py-16">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="w-6 h-6 border-3 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                  <p className="text-gray-500 font-medium">
                    Memuat kampanye...
                  </p>
                </div>
              </div>
            ) : filteredActive.length === 0 ? (
              <div className="text-center py-16">
                <HandCoins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  Tidak ada kampanye aktif ditemukan.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredActive.map((project) => {
                  const progress = Math.min(
                    Math.round(
                      ((project.currentFunding || 0) /
                        (project.budgetTarget || 1)) *
                        100,
                    ),
                    100,
                  );
                  const imgSrc =
                    project.imageUrls?.[0] || CAMPAIGN_IMAGES["default"];
                  const daysLeft = 18; // Mock

                  return (
                    <Card
                      key={project.id}
                      className="overflow-hidden hover:shadow-lg transition-all border-green-100 group"
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-green-50 overflow-hidden">
                        <Image
                          src={imgSrc}
                          alt={project.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge className="bg-yellow-400 text-yellow-900 border-yellow-400 font-bold text-xs">
                            🔥 Aktif
                          </Badge>
                          <Badge className="bg-white/90 text-gray-700 border-gray-200 text-xs">
                            {project.status || "Usulan"}
                          </Badge>
                        </div>
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                          <Clock className="w-3 h-3 text-white" />
                          <span className="text-white text-[11px] font-bold">
                            {daysLeft} hari lagi
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-green-700 transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                          {project.description}
                        </p>

                        {/* Progress */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="font-semibold text-gray-700">
                              Progress Pendanaan
                            </span>
                            <span className="font-bold text-green-600">
                              {progress}%
                            </span>
                          </div>
                          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-yellow-400 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Funding stats */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-xs text-gray-400">Terkumpul</p>
                            <p className="font-black text-green-700">
                              Rp{" "}
                              {(
                                (project.currentFunding || 0) / 1000000
                              ).toFixed(1)}
                              M
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-400">Target</p>
                            <p className="font-black text-gray-700">
                              Rp{" "}
                              {project.budgetTarget
                                ? (project.budgetTarget / 1000000).toFixed(1)
                                : "0"}
                              M
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Donatur</p>
                            <p className="font-black text-blue-600">12</p>
                          </div>
                        </div>

                        <Link href={`/crowdfunding/${project.id}`}>
                          <Button
                            variant="primary"
                            className="w-full bg-green-600 hover:bg-green-700 font-bold flex items-center justify-center gap-2"
                          >
                            <HandCoins className="w-4 h-4" /> Donasi Sekarang
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Completed Campaigns */}
        {activeTab === "completed" && (
          <>
            {filteredCompleted.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  Belum ada kampanye yang selesai.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCompleted.map((project) => (
                  <Card
                    key={project.id}
                    className="overflow-hidden border-green-100 opacity-90"
                  >
                    <div className="relative h-40 bg-green-50 overflow-hidden">
                      <Image
                        src={
                          project.imageUrls?.[0] || CAMPAIGN_IMAGES["default"]
                        }
                        alt={project.title}
                        fill
                        className="object-cover grayscale"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <Badge className="absolute top-3 left-3 bg-green-600 text-white border-green-600 font-bold">
                        ✅ Selesai
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 mb-2">
                        {project.title}
                      </h3>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-500">Total Terkumpul</span>
                        <span className="font-bold text-green-600">
                          Rp{" "}
                          {((project.currentFunding || 0) / 1000000).toFixed(1)}
                          M
                        </span>
                      </div>
                      <div className="w-full h-2 bg-green-200 rounded-full">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: "100%" }}
                        ></div>
                      </div>
                      <p className="text-xs text-green-600 font-semibold mt-2 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" /> 100% Target Tercapai
                      </p>
                      <Link href={`/project/${project.id}`}>
                        <Button
                          variant="outline"
                          className="w-full text-sm border-green-300 text-green-700 mt-3"
                        >
                          Lihat Hasil Proyek
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* How it works */}
        <Card className="p-6 border-green-100 bg-gradient-to-br from-green-50 to-white">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-green-600" /> Cara Kerja
            Crowdfunding LIVON
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: "1",
                icon: "🔍",
                title: "Pilih Proyek",
                desc: "Browse proyek komunitas yang butuh dukungan dana dari warga.",
              },
              {
                step: "2",
                icon: "💳",
                title: "Donasi",
                desc: "Pilih nominal donasi dan lakukan pembayaran dengan aman.",
              },
              {
                step: "3",
                icon: "📊",
                title: "Pantau",
                desc: "Ikuti perkembangan proyek secara real-time di peta LIVON.",
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-600 text-white rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm">
                  {item.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
