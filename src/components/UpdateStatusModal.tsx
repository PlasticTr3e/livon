"use client";
import { Button } from "./ui/WireframePrimitives";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import { useState } from "react";

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatus: string;
  projectName: string;
}

export function UpdateStatusModal({
  isOpen,
  onClose,
  currentStatus,
  projectName,
}: UpdateStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const statusOptions = ["Planning", "Funding", "Construction", "Completed"];
  const currentIndex = statusOptions.indexOf(currentStatus);

  const getNextStatuses = () => {
    return statusOptions.slice(currentIndex + 1);
  };

  const handleConfirm = () => {
    console.log("Status updated:", { selectedStatus, notes });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-green-100 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-green-100 dark:border-slate-700 bg-green-50 dark:bg-slate-800">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              Update Status Proyek
            </h2>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1 font-medium">
              {projectName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-green-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Current Status */}
          <div className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl">
            <p className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Status Saat Ini
            </p>
            <p className="font-bold text-gray-900 dark:text-slate-100">
              {currentStatus}
            </p>
          </div>

          {/* New Status Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-3">
              Pilih Status Baru
            </label>
            <div className="space-y-2">
              {getNextStatuses().length > 0 ? (
                getNextStatuses().map((status) => (
                  <label
                    key={status}
                    className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedStatus === status
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-slate-600 hover:border-green-300 dark:hover:border-green-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={selectedStatus === status}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-4 h-4 accent-green-600 border-gray-300"
                    />
                    <span className="ml-3 font-semibold text-gray-900 dark:text-slate-100">
                      {status}
                    </span>
                  </label>
                ))
              ) : (
                <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3" />
                  <p className="text-sm text-green-800 dark:text-green-300 font-medium">
                    Proyek sudah berada di status akhir (Completed).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {getNextStatuses().length > 0 && (
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">
                Catatan / Alasan Perubahan (Opsional)
              </label>
              <textarea
                className="w-full p-3 border border-green-200 dark:border-slate-600 rounded-xl bg-green-50 dark:bg-slate-900 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm min-h-[80px] resize-none"
                placeholder="Tambahkan catatan atau alasan perubahan status ini..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}

          {/* Warning */}
          {getNextStatuses().length > 0 && selectedStatus !== currentStatus && (
            <div className="flex items-start p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-3 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p className="font-bold mb-1">Tindakan ini akan:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
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

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-green-100 dark:border-slate-700 bg-green-50 dark:bg-slate-800">
          <Button
            variant="outline"
            className="px-6 h-11 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            className="px-6 h-11 bg-green-600 hover:bg-green-700 font-bold"
            onClick={handleConfirm}
            disabled={
              selectedStatus === currentStatus || getNextStatuses().length === 0
            }
          >
            Konfirmasi Update
          </Button>
        </div>
      </div>
    </div>
  );
}
