import { memo, useMemo } from "react";
import Link from "next/link";
import { HandCoins } from "lucide-react";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import {
  formatCrowdfundingAmount,
  getCrowdfundingCoverImage,
  getCrowdfundingProjectStats,
} from "@/lib/crowdfunding/crowdfunding-format";
import type { CrowdfundingProject } from "@/lib/crowdfunding/crowdfunding-types";

type CrowdfundingCampaignCardProps = {
  project: CrowdfundingProject;
};

export const CrowdfundingCampaignCard = memo(function CrowdfundingCampaignCard({
  project,
}: CrowdfundingCampaignCardProps) {
  const { collected, progress, target } = useMemo(
    () => getCrowdfundingProjectStats(project),
    [project],
  );
  const collectedLabel = useMemo(
    () => formatCrowdfundingAmount(collected),
    [collected],
  );
  const targetLabel = useMemo(() => formatCrowdfundingAmount(target), [target]);

  return (
    <Card className="group overflow-hidden border-green-100 bg-white transition-all hover:shadow-lg dark:border-slate-800 dark:bg-[#111827]">
      <div className="relative h-48 overflow-hidden bg-green-50 dark:bg-slate-900">
        <ImageWithFallback
          src={getCrowdfundingCoverImage(project)}
          alt={project.title}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className="border-yellow-400 bg-yellow-400 text-xs font-bold text-yellow-900">
            Active
          </Badge>
        </div>
      </div>

      <div className="p-5">
        <h3 className="mb-1 font-bold text-gray-900 transition-colors group-hover:text-green-700 dark:text-white dark:group-hover:text-green-300">
          {project.title}
        </h3>
        <p className="mb-4 line-clamp-2 text-xs text-gray-500 dark:text-slate-300">
          {project.description}
        </p>

        <div className="mb-3">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="font-semibold text-gray-700 dark:text-slate-300">
              Funding Progress
            </span>
            <span className="font-bold text-green-600 dark:text-green-400">
              {progress}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-yellow-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 dark:text-slate-400">
              Collected
            </p>
            <p className="text-sm font-black text-green-700 dark:text-green-400">
              Rp {collectedLabel}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 dark:text-slate-400">Target</p>
            <p className="text-sm font-black text-gray-700 dark:text-slate-100">
              Rp {targetLabel}
            </p>
          </div>
        </div>

        <Link href={`/crowdfunding/${project.id}`}>
          <Button
            variant="primary"
            className="flex w-full items-center justify-center gap-2 bg-green-600 font-bold hover:bg-green-700"
          >
            <HandCoins className="h-4 w-4" /> Donate Now
          </Button>
        </Link>
      </div>
    </Card>
  );
});
