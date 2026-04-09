"use client";
import { Suspense, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Button, Input } from "@/components/ui/WireframePrimitives";
import { ArrowLeft, UploadCloud, MapPin, Save, Trash2 } from "lucide-react";
import Link from "next/link";
interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
}

function EditProjectContent() {
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    budget: "",
    duration: "",
    category: "Infrastructure",
    status: "Planning",
    lat: -6.2088,
    lng: 106.8456,
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);

  const handleInput = (field: string, value: string | number) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const sizeKB = file.size / 1024;
      const size =
        sizeKB > 1024
          ? `${(sizeKB / 1024).toFixed(1)} MB`
          : `${sizeKB.toFixed(0)} KB`;
      setUploadedFiles((prev) => [
        ...prev,
        {
          id: `f${Date.now()}_${Math.random()}`,
          name: file.name,
          size,
          type: file.name.split(".").pop()?.toUpperCase() || "FILE",
        },
      ]);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return "📄";
      case "jpg":
      case "png":
        return "🖼️";
      case "zip":
        return "🗜️";
      case "dwg":
        return "📐";
      default:
        return "📎";
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-slate-50 dark:bg-slate-950 min-h-full max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/projects">
          <Button
            variant="ghost"
            className="p-2 border border-green-200 bg-white hover:bg-green-50"
          >
            <ArrowLeft className="w-5 h-5 text-green-600" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-slate-100">
            {isEditMode ? "Edit Proyek" : "Detail Proyek"}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            {isEditMode
              ? "Perbarui detail dan informasi proyek."
              : "Lihat detail proyek."}
          </p>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 flex items-center gap-3 text-green-700">
          <span className="text-lg">✅</span>
          <p className="font-semibold text-sm">Proyek berhasil diperbarui!</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-6 border-green-100 shadow-sm space-y-5">
            <h3 className="font-bold text-gray-800 dark:text-slate-200">
              Informasi Dasar
            </h3>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Nama Proyek
              </label>
              <Input
                placeholder="Nama proyek..."
                className="h-11 border-green-200 focus:ring-green-400"
                value={formData.name}
                onChange={(e) => handleInput("name", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Deskripsi
              </label>
              <textarea
                className="w-full p-3 border border-green-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm min-h-[120px] resize-none text-gray-800 dark:text-slate-200"
                value={formData.description}
                onChange={(e) => handleInput("description", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Anggaran (Rp)
                </label>
                <Input
                  type="number"
                  className="h-11 border-green-200"
                  value={formData.budget}
                  onChange={(e) => handleInput("budget", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Durasi
                </label>
                <Input
                  className="h-11 border-green-200"
                  value={formData.duration}
                  onChange={(e) => handleInput("duration", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Kategori
                </label>
                <select
                  className="w-full h-11 px-3 border border-green-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={formData.category}
                  onChange={(e) => handleInput("category", e.target.value)}
                >
                  <option>Infrastructure</option>
                  <option>Recreation</option>
                  <option>Security</option>
                  <option>Sanitation</option>
                  <option>Facility</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Status
                </label>
                <select
                  className="w-full h-11 px-3 border border-green-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-60"
                  value={formData.status}
                  disabled={!isEditMode}
                  onChange={(e) => handleInput("status", e.target.value)}
                >
                  <option>Planning</option>
                  <option>Funding</option>
                  <option>Construction</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-green-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 dark:text-slate-200">
                📎 Dokumen ({uploadedFiles.length})
              </h3>
              <Button
                variant="outline"
                className="text-sm flex items-center gap-1.5 border-green-300 text-green-700"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-4 h-4" /> Upload
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getFileIcon(file.type)}</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {file.size} • {file.type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setUploadedFiles((prev) =>
                        prev.filter((f) => f.id !== file.id),
                      )
                    }
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {uploadedFiles.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">
                  Belum ada dokumen.
                </p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5 border-green-100 shadow-sm">
            <h3 className="font-bold text-gray-800 dark:text-slate-200 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" /> Lokasi
            </h3>
            <div className="w-full h-48 bg-gradient-to-br from-green-100 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-xl border-2 border-green-200 dark:border-slate-600 flex items-center justify-center mb-3">
              <div className="text-center">
                <MapPin className="w-8 h-8 text-green-500 mx-auto mb-1" />
                <p className="text-xs text-green-700 dark:text-green-400">
                  {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">Lat</label>
                <Input
                  type="number"
                  step="0.000001"
                  className="h-9 text-xs border-green-200 mt-1"
                  value={formData.lat}
                  onChange={(e) =>
                    handleInput("lat", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Lng</label>
                <Input
                  type="number"
                  step="0.000001"
                  className="h-9 text-xs border-green-200 mt-1"
                  value={formData.lng}
                  onChange={(e) =>
                    handleInput("lng", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </Card>

          <Button
            variant="primary"
            className="w-full h-12 font-bold flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 shadow-md"
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 3000);
            }}
          >
            <Save className="w-5 h-5" /> Simpan Perubahan
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function EditProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <EditProjectContent />
    </Suspense>
  );
}
