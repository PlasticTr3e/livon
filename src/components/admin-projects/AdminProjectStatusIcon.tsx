import { Banknote, CheckCircle2, FileText, HardHat } from "lucide-react";
import type { AdminProjectStatus } from "@/lib/admin-projects/admin-projects-types";

export function AdminProjectStatusIcon({
  status,
  className = "h-5 w-5",
}: {
  status: AdminProjectStatus;
  className?: string;
}) {
  switch (status) {
    case "DISETUJUI":
      return <Banknote className={className} />;
    case "BERJALAN":
      return <HardHat className={className} />;
    case "SELESAI":
      return <CheckCircle2 className={className} />;
    case "USULAN":
    default:
      return <FileText className={className} />;
  }
}
