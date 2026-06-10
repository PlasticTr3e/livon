"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarClock, CheckCircle, X } from "lucide-react";
import { apiFetchJson } from "@/lib/api-client";
import { useToast } from "@/components/shared/AppToaster";
import { Button } from "@/components/ui/primitives";

type UpdateProjectStatusDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  projectName: string;
  projectId: string;
  onUpdateSuccess: (newStatus: string, estimatedDurationDays?: number) => void;
};

const PROJECT_STATUS_FLOW = [
  "Planning",
  "Funding",
  "Construction",
  "Completed",
];

const PROJECT_STATUS_TO_DB_STATUS: Record<string, string> = {
  Planning: "USULAN",
  Funding: "DISETUJUI",
  Construction: "BERJALAN",
  Completed: "SELESAI",
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  Funding: "Open fundraising and allow residents to donate.",
  Construction:
    "Move the project into active work and set a duration estimate.",
  Completed: "Close the project as finished.",
};

export function UpdateProjectStatusDialog({
  isOpen,
  onClose,
  currentStatus,
  projectName,
  projectId,
  onUpdateSuccess,
}: UpdateProjectStatusDialogProps) {
  const toast = useToast();
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [estimatedDurationDays, setEstimatedDurationDays] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const nextStatuses = useMemo(() => {
    const currentIndex = PROJECT_STATUS_FLOW.indexOf(currentStatus);
    return PROJECT_STATUS_FLOW.slice(currentIndex + 1);
  }, [currentStatus]);

  const canUpdate =
    selectedStatus !== currentStatus && nextStatuses.length > 0 && !isUpdating;

  useEffect(() => {
    if (!isOpen) return;

    setSelectedStatus(currentStatus);
    setEstimatedDurationDays("");
  }, [currentStatus, isOpen]);

  async function handleConfirm() {
    try {
      setIsUpdating(true);

      const dbStatus = PROJECT_STATUS_TO_DB_STATUS[selectedStatus];
      if (!dbStatus) throw new Error("Invalid project status");

      const token = localStorage.getItem("livon-token");
      const result = await apiFetchJson(
        `/api/projects/${projectId}`,
        "PATCH",
        {
          status: dbStatus,
          ...(selectedStatus === "Construction" && estimatedDurationDays
            ? { estimatedDurationDays: Number(estimatedDurationDays) }
            : {}),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!result.success) {
        throw new Error(result.message || "Failed to update status");
      }

      onUpdateSuccess(
        selectedStatus,
        selectedStatus === "Construction" && estimatedDurationDays
          ? Number(estimatedDurationDays)
          : undefined,
      );
      toast.success("Saved", "Project status updated.");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Update failed", "Failed to update project status.");
    } finally {
      setIsUpdating(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 pb-6 pt-24 backdrop-blur-sm md:pt-28">
      <div className="flex max-h-[calc(100dvh-7.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-green-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#111827] md:max-h-[calc(100dvh-8rem)]">
        <div className="flex items-center justify-between border-b border-green-100 bg-green-50/80 p-6 dark:border-slate-700 dark:bg-[#0B1120]">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              Update Project Status
            </h2>
            <p className="mt-1 text-sm font-medium text-green-700 dark:text-green-400">
              {projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-green-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Close status update dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto p-6 md:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white">
                Current Status
              </p>
              <p className="font-bold text-gray-900 dark:text-white">
                {currentStatus}
              </p>
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-gray-700 dark:text-white">
                Select New Status
              </label>
              <div className="space-y-2">
                {nextStatuses.length > 0 ? (
                  nextStatuses.map((status) => (
                    <label
                      key={status}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-all ${
                        selectedStatus === status
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 hover:border-green-300 dark:border-slate-600 dark:hover:border-green-700"
                      }`}
                    >
                      <input
                        type="radio"
                        name="project-status"
                        value={status}
                        checked={selectedStatus === status}
                        onChange={(event) =>
                          setSelectedStatus(event.target.value)
                        }
                        className="h-4 w-4 border-gray-300 accent-green-600"
                      />
                      <span>
                        <span className="block font-semibold text-gray-900 dark:text-white">
                          {status}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-gray-500 dark:text-slate-300">
                          {STATUS_DESCRIPTIONS[status]}
                        </span>
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="flex items-center rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <CheckCircle className="mr-3 h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      This project is already completed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {nextStatuses.length > 0 && selectedStatus === "Construction" && (
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-white">
                  Estimated Duration
                </label>
                <div className="relative">
                  <CalendarClock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    className="h-12 w-full rounded-xl border border-green-200 bg-green-50 pl-10 pr-4 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                    placeholder="Duration in days"
                    value={estimatedDurationDays}
                    onChange={(event) =>
                      setEstimatedDurationDays(event.target.value)
                    }
                  />
                </div>
              </div>
            )}

            {nextStatuses.length > 0 && selectedStatus !== currentStatus && (
              <div className="flex items-start rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <AlertCircle className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-sm text-amber-800 dark:text-amber-300">
                  <p className="mb-1 font-bold">This action will:</p>
                  <ul className="list-inside list-disc space-y-1 text-xs">
                    <li>
                      Update the project status to{" "}
                      <strong>{selectedStatus}</strong>
                    </li>
                    <li>Notify relevant stakeholders</li>
                    <li>Add a new project timeline entry</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-green-100 bg-green-50/80 p-6 dark:border-slate-700 dark:bg-[#0B1120]">
          <Button
            variant="outline"
            className="h-11 border-green-300 px-6 text-green-700 dark:border-green-700 dark:text-green-400"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="h-11 bg-green-600 px-6 font-bold hover:bg-green-700"
            onClick={handleConfirm}
            disabled={!canUpdate}
          >
            {isUpdating ? "Saving..." : "Confirm Update"}
          </Button>
        </div>
      </div>
    </div>
  );
}
