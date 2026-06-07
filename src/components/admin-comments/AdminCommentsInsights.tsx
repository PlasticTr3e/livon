import { Card } from "@/components/ui/primitives";
import type { AdminCommentsInsight } from "@/lib/admin-comments/admin-comments-types";
import { CheckCircle, MessageSquare, ShieldAlert } from "lucide-react";

type AdminCommentsInsightsProps = {
  insights: AdminCommentsInsight;
};

export function AdminCommentsInsights({
  insights,
}: AdminCommentsInsightsProps) {
  const cards = [
    {
      label: "Total Comments",
      value: insights.total,
      icon: MessageSquare,
      borderClass: "border-green-100",
      iconClass:
        "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    },
    {
      label: "Toxicity",
      value: `${insights.toxicityRate}%`,
      icon: ShieldAlert,
      borderClass: "border-red-100",
      iconClass: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    },
    {
      label: "Positivity",
      value: `${insights.positiveRate}%`,
      icon: CheckCircle,
      borderClass: "border-blue-100",
      iconClass:
        "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const CardIcon = card.icon;

        return (
          <Card
            key={card.label}
            className={`flex items-center gap-4 p-4 dark:border-gray-800 dark:bg-[#1F2937] ${card.borderClass}`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${card.iconClass}`}
            >
              <CardIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-white">
                {card.label}
              </p>
              <p className="text-xl font-black text-gray-900 dark:text-white">
                {card.value}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
