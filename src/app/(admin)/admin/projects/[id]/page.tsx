"use client";
import { Suspense, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Input, cn } from "@/components/ui/WireframePrimitives";
import Image from "next/image";
import {
  ArrowLeft,
  MapPin,
  Activity,
  Trash2,
  Image as ImageIcon,
  FileText,
  Plus,
  Banknote,
  HardHat,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic import for Leaflet map selector
const MapSelectorLeaflet = dynamic<{
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}>(() => import("@/components/MapSelectorLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl" />
  ),
});

interface ProjectCategory {
  id: number;
  name: string;
}

function EditProjectContent() {
  const { id } = useParams();
  const router = useRouter();
  const isCreate = id === "create";

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budgetTarget: "",
    estimatedDurationDays: "",
    categoryId: "",
    status: "USULAN",
    latitude: -6.941,
    longitude: 107.7755,
    startDate: "",
    documentUrl: [] as string[],
  });

  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [projectPhotos, setProjectPhotos] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!isCreate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await fetch("/api/projects/categories");
        if (catRes.ok) {
          const catJson = await catRes.json();
          if (Array.isArray(catJson.data)) {
            setCategories(catJson.data);
          }
        }

        if (!isCreate) {
          const res = await fetch(`/api/projects/${id}`);
          if (res.ok) {
            const json = await res.json();
            const d = json.data;
            if (d) {
              setFormData({
                title: d.title || "",
                description: d.description || "",
                budgetTarget: d.budgetTarget ? String(d.budgetTarget) : "",
                estimatedDurationDays: d.estimatedDurationDays
                  ? String(d.estimatedDurationDays)
                  : "",
                categoryId: d.categoryId ? String(d.categoryId) : "",
                status: d.status || "USULAN",
                latitude: d.latitude || -6.941,
                longitude: d.longitude || 107.7755,
                startDate: d.startDate
                  ? new Date(d.startDate).toISOString().split("T")[0]
                  : "",
                documentUrl: d.documentUrl || [],
              });
              setProjectPhotos(d.imageUrls || []);
            }
          }
        }
      } catch {
        setError("Failed to load project details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isCreate]);

  const handleInput = (field: string, value: string | number | string[]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (projectPhotos.length + files.length > 3) {
      alert("Maximum 3 photos allowed.");
      return;
    }
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      setProjectPhotos((prev) => [...prev, url]);
    });
  };

  const removePhoto = (index: number) => {
    setProjectPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    // Client-side validation for required fields
    if (!formData.title || formData.title.length < 5) {
      setError("Title must be at least 5 characters");
      setIsSaving(false);
      return;
    }
    if (!formData.description || formData.description.length < 10) {
      setError("Description must be at least 10 characters");
      setIsSaving(false);
      return;
    }
    if (!formData.budgetTarget || parseFloat(formData.budgetTarget) <= 0) {
      setError("Budget is required and must be a positive number");
      setIsSaving(false);
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        budgetTarget: parseFloat(formData.budgetTarget),
        latitude: formData.latitude,
        longitude: formData.longitude,
        imageUrls: projectPhotos,
        documentUrls: formData.documentUrl || [],
      };

      // Only add optional numeric fields if they have a value
      if (formData.estimatedDurationDays) {
        payload.estimatedDurationDays = parseInt(
          formData.estimatedDurationDays,
        );
      }
      if (formData.categoryId) {
        payload.categoryId = parseInt(formData.categoryId);
      }
      if (formData.startDate) {
        payload.startDate = new Date(formData.startDate).toISOString();
      }

      const url = isCreate ? "/api/projects" : `/api/projects/${id}`;
      const method = isCreate ? "POST" : "PATCH";

      // If editing, the existing API uses singular 'documentUrl' and allows 'status'
      if (!isCreate) {
        payload.status = formData.status;
        payload.documentUrl = formData.documentUrl;
        delete payload.documentUrls;
      }

      const token = localStorage.getItem("livon-token");

      console.log("Sending payload:", JSON.stringify(payload, null, 2));

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/admin/projects");
        router.refresh();
      } else {
        const errorData = await res.json();
        console.error("API Error Response:", errorData);
        setError(errorData.message || JSON.stringify(errorData));
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto w-full font-sans">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center shadow-sm">
        <Link
          href="/admin/projects"
          className="flex items-center text-green-600 hover:text-green-800 dark:text-green-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium text-sm">Back to Menu</span>
        </Link>
      </div>

      <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {isCreate ? "Create Project" : "Edit Project"}
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {isCreate
                ? "Add a new development proposal"
                : `Managing details for "${formData.title}"`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 px-8 bg-green-600 hover:bg-green-700 rounded-xl font-bold"
            >
              {isSaving
                ? "Saving..."
                : isCreate
                  ? "Publish Project"
                  : "Save Changes"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border-green-100 shadow-sm space-y-6 bg-white rounded-2xl">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-4">
                <FileText className="w-4 h-4 text-green-600" />
                Project Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Project Title
                  </label>
                  <Input
                    placeholder="Enter title..."
                    className="h-12 border-green-200 focus:ring-green-400 rounded-xl"
                    value={formData.title}
                    onChange={(e) => handleInput("title", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Description
                  </label>
                  <textarea
                    className="w-full p-4 border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400 text-sm min-h-[160px] resize-none text-gray-800"
                    placeholder="Detailed description..."
                    value={formData.description}
                    onChange={(e) => handleInput("description", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Budget (IDR)
                  </label>
                  <Input
                    type="number"
                    placeholder="50000000"
                    className="h-12 border-green-200 focus:ring-green-400 rounded-xl"
                    value={formData.budgetTarget}
                    onChange={(e) =>
                      handleInput("budgetTarget", e.target.value)
                    }
                  />
                </div>
                {formData.status === "BERJALAN" && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                      Est. Duration (Days)
                    </label>
                    <Input
                      type="number"
                      placeholder="90"
                      className="h-12 border-green-200 focus:ring-green-400 rounded-xl"
                      value={formData.estimatedDurationDays}
                      onChange={(e) =>
                        handleInput("estimatedDurationDays", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Category
                  </label>
                  <select
                    className="w-full h-12 px-3 border border-green-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400 text-sm font-bold text-gray-700"
                    value={formData.categoryId}
                    onChange={(e) => handleInput("categoryId", e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    className="h-12 border-green-200 focus:ring-green-400 rounded-xl"
                    value={formData.startDate}
                    onChange={(e) => handleInput("startDate", e.target.value)}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-green-100 shadow-sm rounded-2xl bg-white">
              <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-green-600" />
                  Project Gallery
                </h3>
                <span className="text-[10px] font-black text-green-600 uppercase bg-green-50 px-2 py-1 rounded">
                  {projectPhotos.length} / 3 Photos
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {projectPhotos.map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 group"
                  >
                    <Image
                      src={url}
                      alt="Project"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {projectPhotos.length < 3 && (
                  <button
                    onClick={() =>
                      document.getElementById("photo-upload")?.click()
                    }
                    className="aspect-video rounded-xl border-2 border-dashed border-green-100 flex flex-col items-center justify-center gap-1 hover:bg-green-50 transition-all group"
                  >
                    <Plus className="w-5 h-5 text-green-300 group-hover:text-green-600 transition-colors" />
                    <span className="text-[10px] font-bold text-green-600/50">
                      Add Photo
                    </span>
                  </button>
                )}
              </div>
              <input
                id="photo-upload"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </Card>

            <Card className="p-6 border-green-100 shadow-sm rounded-2xl bg-white">
              <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  Supporting Documents
                </h3>
                <span className="text-[10px] font-black text-green-600 uppercase bg-green-50 px-2 py-1 rounded">
                  PDF / ZIP
                </span>
              </div>

              <div className="space-y-3">
                {formData.documentUrl && formData.documentUrl.length > 0 ? (
                  formData.documentUrl.map((url: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 border border-gray-100 rounded-xl"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-white rounded-lg text-green-600 border border-gray-50 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-gray-700 truncate">
                          {url.split("/").pop() || `Document ${index + 1}`}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const newDocs = formData.documentUrl.filter(
                            (_: string, i: number) => i !== index,
                          );
                          handleInput("documentUrl", newDocs);
                        }}
                        className="text-red-500 hover:text-red-700 ml-2 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-8 border-2 border-dashed border-green-50 rounded-2xl flex flex-col items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-green-100" />
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      No documents uploaded
                    </p>
                  </div>
                )}

                <button
                  onClick={() => document.getElementById("doc-upload")?.click()}
                  className="w-full h-11 border border-green-200 border-dashed rounded-xl flex items-center justify-center gap-2 text-green-600 font-bold text-[11px] hover:bg-green-50 transition-all mt-2"
                >
                  <Plus className="w-4 h-4" />
                  UPLOAD DOCUMENT
                </button>
                <input
                  id="doc-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files) return;
                    const urls = Array.from(files).map((f) =>
                      URL.createObjectURL(f),
                    );
                    handleInput("documentUrl", [
                      ...(formData.documentUrl || []),
                      ...urls,
                    ]);
                  }}
                />
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 border-green-100 shadow-sm rounded-2xl bg-white">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-4 mb-4">
                <Activity className="w-4 h-4 text-green-600" />
                Project Status
              </h3>
              <div className="flex flex-col gap-2">
                {["USULAN", "DISETUJUI", "BERJALAN", "SELESAI"].map((s) => {
                  const isActive = formData.status === s;
                  const getStyle = (status: string) => {
                    switch (status) {
                      case "USULAN":
                        return isActive
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-gray-100 bg-gray-50 text-gray-400";
                      case "DISETUJUI":
                        return isActive
                          ? "border-yellow-500 bg-yellow-50 text-yellow-700 shadow-sm"
                          : "border-gray-100 bg-gray-50 text-gray-400";
                      case "BERJALAN":
                        return isActive
                          ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm"
                          : "border-gray-100 bg-gray-50 text-gray-400";
                      case "SELESAI":
                        return isActive
                          ? "border-green-500 bg-green-50 text-green-700 shadow-sm"
                          : "border-gray-100 bg-gray-50 text-gray-400";
                      default:
                        return "border-gray-100 bg-gray-50 text-gray-400";
                    }
                  };
                  const getIcon = (status: string) => {
                    switch (status) {
                      case "USULAN":
                        return <FileText className="w-4 h-4" />;
                      case "DISETUJUI":
                        return <Banknote className="w-4 h-4" />;
                      case "BERJALAN":
                        return <HardHat className="w-4 h-4" />;
                      case "SELESAI":
                        return <CheckCircle2 className="w-4 h-4" />;
                      default:
                        return null;
                    }
                  };
                  const getDotColor = (status: string) => {
                    switch (status) {
                      case "USULAN":
                        return "bg-blue-500";
                      case "DISETUJUI":
                        return "bg-yellow-500";
                      case "BERJALAN":
                        return "bg-orange-500";
                      case "SELESAI":
                        return "bg-green-500";
                      default:
                        return "bg-gray-300";
                    }
                  };
                  return (
                    <button
                      key={s}
                      onClick={() => handleInput("status", s)}
                      className={cn(
                        "h-12 rounded-xl border flex items-center px-4 gap-3 transition-all font-bold text-[10px] uppercase tracking-widest",
                        getStyle(s),
                      )}
                    >
                      <div
                        className={cn(
                          "p-1.5 rounded-lg",
                          isActive ? "bg-white/50" : "bg-transparent",
                        )}
                      >
                        {getIcon(s)}
                      </div>
                      <div className="flex-1 text-left">
                        {s === "USULAN"
                          ? "Planning"
                          : s === "DISETUJUI"
                            ? "Funding"
                            : s === "BERJALAN"
                              ? "Construction"
                              : "Completed"}
                      </div>
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isActive
                            ? `${getDotColor(s)} animate-pulse`
                            : "bg-gray-300",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6 border-green-100 shadow-sm rounded-2xl bg-white overflow-hidden">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-4 mb-4">
                <MapPin className="w-4 h-4 text-green-600" />
                Project Location
              </h3>
              <div className="w-full h-56 bg-slate-50 rounded-xl overflow-hidden mb-4 border border-gray-100 shadow-inner">
                <MapSelectorLeaflet
                  lat={formData.latitude}
                  lng={formData.longitude}
                  onChange={(lat, lng) => {
                    handleInput("latitude", lat);
                    handleInput("longitude", lng);
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-gray-100">
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-0.5">
                    Latitude
                  </p>
                  <p className="text-[11px] font-black text-gray-700">
                    {formData.latitude.toFixed(4)}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-gray-100">
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-0.5">
                    Longitude
                  </p>
                  <p className="text-[11px] font-black text-gray-700">
                    {formData.longitude.toFixed(4)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditProjectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full min-h-[600px]">
          <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <EditProjectContent />
    </Suspense>
  );
}
