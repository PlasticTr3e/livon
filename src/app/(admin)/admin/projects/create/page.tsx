"use client";
import { Card, Button, Input } from "@/components/ui/WireframePrimitives";
import Image from "next/image";
import { ArrowLeft, UploadCloud, MapPin, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
}

export default function CreateProjectPage() {
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
  const [projectImage, setProjectImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProjectImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return "📄";
      case "jpg":
      case "png":
      case "jpeg":
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
            Buat Proyek Baru
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm">
            Tambahkan proposal pengembangan baru ke peta.
          </p>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 flex items-center gap-3 text-green-700">
          <span className="text-lg">✅</span>
          <p className="font-semibold text-sm">
            Proyek berhasil dipublikasikan!
          </p>
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
                placeholder="Contoh: Renovasi Taman Blok B Fase 2"
                className="h-11 border-green-200 focus:ring-green-400"
                value={formData.name}
                onChange={(e) => handleInput("name", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Deskripsi Detail
              </label>
              <textarea
                className="w-full p-3 border border-green-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm min-h-[120px] resize-none text-gray-800 dark:text-slate-200"
                placeholder="Jelaskan tujuan, manfaat, dan dampak proyek ini..."
                value={formData.description}
                onChange={(e) => handleInput("description", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Anggaran Estimasi (Rp)
                </label>
                <Input
                  type="number"
                  placeholder="50000000"
                  className="h-11 border-green-200 focus:ring-green-400"
                  value={formData.budget}
                  onChange={(e) => handleInput("budget", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Durasi Estimasi
                </label>
                <Input
                  placeholder="Contoh: 3 Bulan"
                  className="h-11 border-green-200 focus:ring-green-400"
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
                  className="w-full h-11 px-3 border border-green-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm text-gray-700 dark:text-slate-300"
                  value={formData.category}
                  onChange={(e) => handleInput("category", e.target.value)}
                >
                  <option>Infrastructure</option>
                  <option>Recreation</option>
                  <option>Security</option>
                  <option>Sanitation</option>
                  <option>Facility</option>
                  <option>Education</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Status Awal
                </label>
                <select
                  className="w-full h-11 px-3 border border-green-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-green-400 text-sm text-gray-700 dark:text-slate-300"
                  value={formData.status}
                  onChange={(e) => handleInput("status", e.target.value)}
                >
                  <option>Planning</option>
                  <option>Funding</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-green-100 shadow-sm">
            <h3 className="font-bold text-gray-800 dark:text-slate-200 mb-4">
              Foto Proyek
            </h3>
            {projectImage ? (
              <div className="relative h-48 w-full border border-green-200 rounded-xl overflow-hidden">
                <Image
                  src={projectImage}
                  alt="Project"
                  fill
                  className="object-cover"
                />
                <button
                  onClick={() => setProjectImage(null)}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-green-300 rounded-xl p-8 flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/20 cursor-pointer hover:bg-green-100 transition-colors text-center"
                onClick={() => imageInputRef.current?.click()}
              >
                <UploadCloud className="w-10 h-10 mb-3 text-green-500" />
                <p className="font-semibold text-green-700 dark:text-green-400">
                  Klik untuk upload foto
                </p>
                <p className="text-xs text-green-500 mt-1">
                  PNG, JPG hingga 5MB
                </p>
              </div>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              className="hidden"
              onChange={handleImageUpload}
            />
          </Card>

          <Card className="p-6 border-green-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                📎 Dokumen Pendukung
                <span className="text-xs text-gray-500 font-normal bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                  {uploadedFiles.length} file
                </span>
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
                accept=".pdf,.jpg,.jpeg,.png,.zip,.dwg,.doc,.docx,.xlsx"
                onChange={handleFileUpload}
              />
            </div>
            <div
              className="border-2 border-dashed border-green-200 rounded-xl p-6 flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/10 cursor-pointer hover:bg-green-100 transition-colors mb-4 text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="w-8 h-8 text-green-400 mb-2" />
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                Drag & drop atau klik untuk upload
              </p>
              <p className="text-xs text-green-500 mt-1">
                PDF, DWG, ZIP, JPG, DOCX hingga 50MB
              </p>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="divide-y divide-gray-100 dark:divide-slate-700">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="py-3 flex items-center justify-between group"
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
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5 border-green-100 shadow-sm">
            <h3 className="font-bold text-gray-800 dark:text-slate-200 mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" /> Lokasi Proyek
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
              Tentukan koordinat lokasi proyek.
            </p>
            <div className="w-full h-60 bg-gradient-to-br from-green-100 via-green-50 to-blue-50 dark:from-slate-800 dark:to-slate-700 rounded-xl border-2 border-green-200 dark:border-slate-600 relative flex items-center justify-center mb-3">
              <div
                className="absolute inset-0 opacity-10 rounded-xl"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #16a34a 1px, transparent 1px), linear-gradient(to bottom, #16a34a 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                }}
              ></div>
              <div className="text-center z-10">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
                <p className="text-green-700 dark:text-green-400 font-bold text-sm">
                  Lokasi Proyek
                </p>
                <p className="text-green-500 text-xs mt-1">
                  {formData.lat.toFixed(4)}, {formData.lng.toFixed(4)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Latitude
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="-6.2088"
                  className="h-9 text-xs border-green-200 mt-1"
                  value={formData.lat}
                  onChange={(e) =>
                    handleInput("lat", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">
                  Longitude
                </label>
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="106.8456"
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
            <Save className="w-5 h-5" /> Publikasikan Proyek
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 font-bold border-green-300 text-green-700 hover:bg-green-50"
          >
            Simpan sebagai Draft
          </Button>

          <Card className="p-4 border-blue-100 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <p className="font-bold text-blue-700 dark:text-blue-400 text-sm mb-2">
              💡 Tips
            </p>
            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1.5 leading-relaxed">
              <li>
                • Sertakan foto kondisi saat ini untuk memperkuat proposal.
              </li>
              <li>• Dokumen RAB meningkatkan kepercayaan warga.</li>
              <li>
                • Lokasi yang tepat memudahkan warga menemukan proyek di peta.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
