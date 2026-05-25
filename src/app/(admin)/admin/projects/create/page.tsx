"use client";
import { Card, Button, Input } from "@/components/ui/WireframePrimitives";
import Image from "next/image";
import { ArrowLeft, UploadCloud, MapPin, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const DynamicMapPicker = dynamic(() => import("@/components/mapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-500 rounded-lg">
      Memuat Peta...
    </div>
  ),
});

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
    // -6.9321823, 107.7754652
    lat: -6.9321823,
    lng: 107.7754652,
  });
  const [position, setPosition] = useState({
    lat: formData.lat,
    lng: formData.lng,
  });
  const [modalPosition, setModalPosition] = useState(position);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [projectImage, setProjectImage] = useState<string | null>(null);
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    setFormData((prev) => ({ ...prev, lat: position.lat, lng: position.lng }));
  }, [position]);

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
    setProjectImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProjectImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const openMapModal = () => {
    setModalPosition(position);
    setIsMapModalOpen(true);
  };

  const closeMapModal = () => {
    setIsMapModalOpen(false);
  };

  const confirmLocation = () => {
    setPosition(modalPosition);
    setIsMapModalOpen(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMsg("");
    try {
      const token = localStorage.getItem("livon-token");
      if (!token) throw new Error("Sesi telah habis. Silakan login kembali.");

      if (formData.name.length < 5)
        throw new Error("Nama proyek minimal 5 karakter.");
      if (formData.description.length < 10)
        throw new Error("Deskripsi minimal 10 karakter.");

      const budgetTarget = Number(formData.budget);
      if (isNaN(budgetTarget) || budgetTarget <= 0) {
        throw new Error("Anggaran harus berupa angka positif.");
      }

      const imageUrls: string[] = [];

      if (projectImageFile) {
        const uploadData = new FormData();
        uploadData.append("file", projectImageFile);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadData,
        });

        if (!uploadRes.ok) {
          throw new Error("Gagal mengupload gambar.");
        }

        const uJson = await uploadRes.json();
        if (uJson?.data?.url) {
          imageUrls.push(uJson.data.url);
        }
      }

      let estimatedDurationDays = 0;
      const durationMatch = formData.duration.match(/(\d+)/);
      if (durationMatch) {
        const num = parseInt(durationMatch[1], 10);
        if (formData.duration.toLowerCase().includes("bulan")) {
          estimatedDurationDays = num * 30;
        } else if (formData.duration.toLowerCase().includes("minggu")) {
          estimatedDurationDays = num * 7;
        } else {
          estimatedDurationDays = num;
        }
      }

      const payload: Record<string, unknown> = {
        title: formData.name,
        description: formData.description,
        budgetTarget,
        latitude: formData.lat,
        longitude: formData.lng,
      };

      if (imageUrls.length > 0) {
        payload.imageUrls = imageUrls;
      }

      if (estimatedDurationDays > 0) {
        payload.estimatedDurationDays = estimatedDurationDays;
      }

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Gagal menyimpan proyek");
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        router.push("/admin/projects");
      }, 2000);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Terjadi kesalahan sistem.",
      );
    } finally {
      setIsSubmitting(false);
    }
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

      {errorMsg && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <span className="text-lg">⚠️</span>
          <p className="font-semibold text-sm">{errorMsg}</p>
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
                  onClick={() => {
                    setProjectImage(null);
                    setProjectImageFile(null);
                  }}
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
            <button
              type="button"
              onClick={openMapModal}
              className="w-full h-60 rounded-xl border-2 border-green-200 dark:border-slate-600 overflow-hidden mb-3 relative focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <div className="absolute inset-0 bg-black/10 z-10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white font-semibold">
                Klik untuk pilih lokasi
              </div>
              <div className="h-full w-full">
                <DynamicMapPicker
                  position={position}
                  setPosition={() => {}}
                  readOnly
                />
              </div>
            </button>
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

          {isMapModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8">
              <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-green-100 dark:border-slate-700">
                <div className="flex items-center justify-between p-5 border-b border-green-100 dark:border-slate-700 bg-green-50 dark:bg-slate-800">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                      Pilih Lokasi Proyek
                    </h2>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Klik peta untuk memindahkan titik penanda.
                    </p>
                  </div>
                  <button
                    onClick={closeMapModal}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                </div>
                <div className="h-[420px] bg-slate-100 dark:bg-slate-950">
                  <DynamicMapPicker
                    position={modalPosition}
                    setPosition={setModalPosition}
                  />
                </div>
                <div className="flex flex-col gap-3 p-5 border-t border-green-100 dark:border-slate-700 bg-white dark:bg-slate-900 sm:flex-row sm:justify-between sm:items-center">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Titik terpilih: {modalPosition.lat.toFixed(6)},{" "}
                      {modalPosition.lng.toFixed(6)}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={closeMapModal}
                      className="h-11 px-5 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={confirmLocation}
                      className="h-11 px-5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
                    >
                      Set Lokasi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            className="w-full h-12 font-bold flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 shadow-md"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Save className="w-5 h-5" />{" "}
            {isSubmitting ? "Menyimpan..." : "Publikasikan Proyek"}
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
