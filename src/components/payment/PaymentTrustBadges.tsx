import { CheckCircle2, Leaf, Shield } from "lucide-react";

const trustBadges = [
  { label: "SSL Encrypted", icon: Shield },
  { label: "100% Transparent", icon: CheckCircle2 },
  { label: "LIVON", icon: Leaf },
];

export function PaymentTrustBadges() {
  return (
    <div className="flex items-center justify-center gap-5 text-xs text-gray-400">
      {trustBadges.map((badge) => {
        const Icon = badge.icon;

        return (
          <span key={badge.label} className="flex items-center gap-1">
            <Icon className="h-3.5 w-3.5 text-green-500" /> {badge.label}
          </span>
        );
      })}
    </div>
  );
}
