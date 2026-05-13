"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui/WireframePrimitives";
import Image from "next/image";
import { apiFetch } from "@/lib/api-client";
import { HandCoins, Search } from "lucide-react";

/**
 * Data structure representing a crowdfunding project fetched from the API.
 */
interface ProjectFromDB {
  id: string;
  title: string;
  description: string;
  status?: string;
  budgetTarget?: number | string;
  currentFunding?: number | string;
  imageUrls?: string[];
}

/**
 * Fallback images for campaigns that don't have their own images.
 */
const CAMPAIGN_IMAGES: Record<string, string> = {
  default:
    "https://images.unsplash.com/photo-1774697442958-283860cf8409?w=800&h=600&fit=crop",
};

/**
 * Sub-component to render an individual campaign card.
 * Extracted for better readability and maintainability.
 */
function CampaignCard({ project }: { project: ProjectFromDB }) {
  const currentFunding = Number(project.currentFunding || 0);
  const budgetTarget = Number(project.budgetTarget || 1);

  // Calculate percentage of target reached, capped at 100%
  const progress = Math.min(
    Math.round((currentFunding / budgetTarget) * 100),
    100,
  );

  // Use project image or fallback to default
  const imgSrc = project.imageUrls?.[0] || CAMPAIGN_IMAGES["default"];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all border-green-100 group">
      {/* Image Section */}
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
            Active
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        <h3 className="font-bold text-gray-900 mb-1 group-hover:text-green-700 transition-colors">
          {project.title}
        </h3>
        <p className="text-xs text-gray-500 mb-4 line-clamp-2">
          {project.description}
        </p>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-gray-700">
              Funding Progress
            </span>
            <span className="font-bold text-green-600">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-yellow-400 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Funding Stats */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400">Collected</p>
            <p className="font-black text-green-700 text-sm">
              Rp {currentFunding.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Target</p>
            <p className="font-black text-gray-700 text-sm">
              Rp {budgetTarget.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Link href={`/crowdfunding/${project.id}`}>
          <Button
            variant="primary"
            className="w-full bg-green-600 hover:bg-green-700 font-bold flex items-center justify-center gap-2"
          >
            <HandCoins className="w-4 h-4" /> Donate Now
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default function CrowdfundingListPage() {
  // --- State Management ---
  const [projects, setProjects] = useState<ProjectFromDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // --- Data Fetching ---
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
          // Fetch detailed data for each project because /api/projects only returns limited fields
          const detailedProjects = await Promise.all(
            response.data.map(async (project) => {
              try {
                const detailRes = await apiFetch<ProjectFromDB>(
                  `/api/projects/${project.id}`,
                  { headers },
                );
                if (detailRes.success && detailRes.data) {
                  return { ...project, ...detailRes.data };
                }
              } catch (e) {
                console.error(
                  `Failed to fetch details for project ${project.id}:`,
                  e,
                );
              }
              return project;
            }),
          );
          setProjects(detailedProjects);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // --- Data Filtering ---

  // 1. Only show projects that are approved (DISETUJUI)
  const fundingProjects = projects.filter(
    (p) => p.status && p.status.toUpperCase() === "DISETUJUI",
  );

  // 2. Filter further based on the user's search query
  const filteredActive = fundingProjects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 w-full space-y-8">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 border-b border-gray-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-md shrink-0">
                <HandCoins className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100">
                Crowdfunding
              </h1>
            </div>
            <p className="text-sm text-gray-500 dark:text-slate-400 ml-[52px] max-w-md leading-relaxed">
              Help create a better environment by donating to ongoing community
              projects.
            </p>
          </div>

          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search campaigns..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* --- Campaigns List --- */}
        {loading ? (
          <div className="text-center py-16">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-6 h-6 border-3 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 font-medium">Loading campaigns...</p>
            </div>
          </div>
        ) : filteredActive.length === 0 ? (
          <div className="text-center py-16">
            <HandCoins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              No active campaigns found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredActive.map((project) => (
              <CampaignCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
