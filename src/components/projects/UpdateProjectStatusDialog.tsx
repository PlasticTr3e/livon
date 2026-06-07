"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";
import { apiFetchJson } from "@/lib/api-client";
import { useToast } from "@/components/shared/AppToaster";
import { Button } from "@/components/ui/primitives";

type UpdateProjectStatusDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  projectName: string;
  projectId: string;
  onUpdateSuccess: (newStatus: string) => void;
};

const PROJECT_STATUS_FLOW = [
  "Planning",
  "Funding",
  "Under Construction",
  "Completed",
];

const PROJECT_STATUS_TO_DB_STATUS: Record<string, string> = {
  Planning: "USULAN",
  Funding: "DISETUJUI",
  "Under Construction": "BERJALAN",
  Construction: "BERJALAN",
  Completed: "SELESAI",
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
  const [notes, setNotes] = useState("");
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
    setNotes("");
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
        { status: dbStatus, notes },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!result.success) {
        throw new Error(result.message || "Failed to update status");
      }

      onUpdateSuccess(selectedStatus);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-3xl overflow-hidden rounded-2xl border border-green-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between border-b border-green-100 bg-green-50 p-6 dark:border-slate-700 dark:bg-slate-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Update Status Proyek
            </h2>
            <p className="mt-1 text-sm font-medium text-green-700 dark:text-green-400">
              {projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-green-100 dark:hover:bg-slate-700"
            aria-label="Close status update dialog"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-white" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-600 dark:bg-slate-900">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white">
                Status Saat Ini
              </p>
              <p className="font-bold text-gray-900 dark:text-white">
                {currentStatus}
              </p>
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-gray-700 dark:text-white">
                Pilih Status Baru
              </label>
              <div className="space-y-2">
                {nextStatuses.length > 0 ? (
                  nextStatuses.map((status) => (
                    <label
                      key={status}
                      className={`flex cursor-pointer items-center rounded-xl border-2 p-4 transition-all ${
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
                      <span className="ml-3 font-semibold text-gray-900 dark:text-white">
                        {status}
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="flex items-center rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <CheckCircle className="mr-3 h-5 w-5 text-green-600 dark:text-green-400" />
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                      Proyek sudah berada di status akhir (Completed).
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {nextStatuses.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700 dark:text-white">
                  Catatan / Alasan Perubahan (Opsional)
                </label>
                <textarea
                  className="h-[132px] w-full resize-none rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  placeholder="Tambahkan catatan atau alasan perubahan status ini..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
            )}

            {nextStatuses.length > 0 && selectedStatus !== currentStatus && (
              <div className="flex h-[132px] items-start rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <AlertCircle className="mr-3 mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-sm text-amber-800 dark:text-amber-300">
                  <p className="mb-1 font-bold">Tindakan ini akan:</p>
                  <ul className="list-inside list-disc space-y-1 text-xs">
                    <li>
                      Memperbarui status proyek menjadi{" "}
                      <strong>{selectedStatus}</strong>
                    </li>
                    <li>Memberi notifikasi ke seluruh stakeholder</li>
                    <li>Memperbarui timeline proyek</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-green-100 bg-green-50 p-6 dark:border-slate-700 dark:bg-slate-800">
          <Button
            variant="outline"
            className="h-11 border-green-300 px-6 text-green-700 dark:border-green-700 dark:text-green-400"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            className="h-11 bg-green-600 px-6 font-bold hover:bg-green-700"
            onClick={handleConfirm}
            disabled={!canUpdate}
          >
            {isUpdating ? "Menyimpan..." : "Konfirmasi Update"}
          </Button>
        </div>
      </div>
    </div>
  );
}
