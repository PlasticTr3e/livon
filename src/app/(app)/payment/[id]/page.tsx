"use client";
import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, cn } from "@/components/ui/WireframePrimitives";
import {
  ArrowLeft,
  CheckCircle2,
  Shield,
  Clock,
  Check,
  Leaf,
  HandCoins,
} from "lucide-react";

type Step = "confirm" | "success";

function PaymentContent() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [project, setProject] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [timeLeft, setTimeLeft] = useState(1800);

  useEffect(() => {
    // Jika waktu habis, berhenti
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    // Bersihkan timer jika komponen unmount agar tidak memory leak
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem("livon-token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`/api/projects/${id}`, { headers });
        const json = await res.json();
        if (json.success && json.data) {
          setProject({ id: json.data.id, name: json.data.title });
        }
      } catch (e) {
        console.error("Failed to fetch project:", e);
      } finally {
        setIsLoadingProject(false);
      }
    };
    if (id) fetchProject();
  }, [id]);

  const amount = parseInt(searchParams.get("amount") || "0");

  // Tangkap status dari URL Midtrans saat user dikembalikan
  const transactionStatus = searchParams.get("transaction_status");

  // Midtrans mengirim "settlement" atau "capture" jika bayar sukses
  const isFromMidtransSuccess =
    transactionStatus === "settlement" || transactionStatus === "capture";

  // Jika URL punya status sukses, langsung buka halaman "success", jika tidak "confirm"
  const [step] = useState<Step>(
    // const [step, setStep] = useState<Step>(
    isFromMidtransSuccess ? "success" : "confirm",
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("livon-token");
      if (!token) {
        alert("Silakan login untuk melanjutkan donasi.");
        setIsProcessing(false);
        return;
      }
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: id,
          amount: amount,
        }),
      });
      const result = await res.json();
      if (res.ok && result.success && result.data?.paymentUrl) {
        window.location.href = result.data.paymentUrl;
        return;
      } else {
        alert(result.message || "Gagal memproses donasi.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat memproses donasi.");
    }
    setIsProcessing(false);
  };

  if (isLoadingProject) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Memuat pembayaran...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <p className="text-gray-500 font-medium mb-2">
          Proyek tidak ditemukan.
        </p>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="border-green-300 text-green-700"
        >
          Kembali
        </Button>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-16 text-center w-full">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-green-200">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100 mb-2">
            Donasi Berhasil!
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
            Terima kasih telah mendukung{" "}
            <strong className="text-green-700 dark:text-green-400">
              {project.name}
            </strong>
            .<br />
            Kontribusi Anda sangat berarti bagi komunitas!
          </p>
          <Card className="p-5 border-green-200 mb-6 text-left">
            <div className="space-y-3">
              {[
                { label: "Proyek", value: project.name },
                {
                  label: "Jumlah Donasi",
                  value: `Rp ${amount.toLocaleString("id-ID")}`,
                },
                {
                  label: "ID Transaksi",
                  value: `TRX-${Date.now().toString().slice(-8)}`,
                },
                { label: "Waktu", value: new Date().toLocaleString("id-ID") },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center"
                >
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6 text-sm text-green-700 dark:text-green-400">
            <p className="font-semibold mb-1">
              Ajak warga lain untuk berdonasi!
            </p>
            <p className="text-xs text-green-600 dark:text-green-500">
              Bagikan kampanye ini ke tetangga Anda dan percepat terwujudnya
              proyek ini.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href={`/app/crowdfunding/${project.id}`}>
              <Button
                variant="primary"
                className="w-full h-12 bg-green-600 hover:bg-green-700 font-bold flex items-center justify-center gap-2"
              >
                <HandCoins className="w-4 h-4" /> Lihat Kampanye
              </Button>
            </Link>
            <Link href="/app/map">
              <Button
                variant="outline"
                className="w-full h-12 border-green-300 text-green-700 font-bold"
              >
                Kembali ke Peta
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center text-green-600 hover:text-green-800 dark:text-green-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium text-sm">Kembali</span>
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Pembayaran Aman
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border-b border-green-100 dark:border-slate-700 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          {(["confirm", "success"] as Step[]).map((s, idx) => {
            const labels = ["Konfirmasi", "Selesai"];
            const steps: Step[] = ["confirm", "success"];
            const currentIdx = steps.indexOf(step);
            const stepIdx = steps.indexOf(s);
            const isCompleted = stepIdx < currentIdx;
            const isCurrent = stepIdx === currentIdx;
            return (
              <div key={s} className="flex items-center flex-1">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                      isCompleted
                        ? "bg-green-600 border-green-600 text-white"
                        : isCurrent
                          ? "bg-white dark:bg-slate-800 border-green-600 text-green-600 dark:text-green-400"
                          : "bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-400",
                    )}
                  >
                    {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold whitespace-nowrap",
                      isCurrent
                        ? "text-green-700 dark:text-green-400"
                        : isCompleted
                          ? "text-green-600 dark:text-green-500"
                          : "text-gray-400",
                    )}
                  >
                    {labels[idx]}
                  </span>
                </div>
                {idx < 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2 transition-all",
                      stepIdx < currentIdx
                        ? "bg-green-500"
                        : "bg-gray-200 dark:bg-slate-600",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 w-full space-y-5">
        <Card className="p-5 border-2 border-green-200 bg-gradient-to-br from-green-700 to-green-900 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-5 h-5 text-green-300" />
            <p className="text-xs font-bold text-green-300 uppercase tracking-widest">
              Ringkasan Donasi
            </p>
          </div>
          <p className="font-bold text-green-200 text-sm mb-1">
            {project.name}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-sm text-green-400">Rp</span>
            <span className="text-3xl font-black">
              {amount.toLocaleString("id-ID")}
            </span>
          </div>
        </Card>

        {step === "confirm" && (
          <div className="space-y-4">
            <Card className="p-5 border-green-100">
              <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-4">
                Rincian Pembayaran
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    Jumlah Donasi
                  </span>
                  <span className="text-sm font-semibold dark:text-slate-200">
                    Rp {amount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-slate-600">
                  <span className="font-bold text-gray-900 dark:text-slate-100">
                    Total Pembayaran
                  </span>
                  <span className="font-black text-green-600 text-lg">
                    Rp {amount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </Card>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-slate-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span>
                Selesaikan pembayaran dalam{" "}
                <strong className="...">{formatTime(timeLeft)}</strong>
              </span>
            </div>
            <Button
              variant="primary"
              className="w-full h-14 font-black text-lg flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
              onClick={handleConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Konfirmasi Pembayaran
                </>
              )}
            </Button>
          </div>
        )}

        <div className="flex items-center justify-center gap-5 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-green-500" /> SSL Enkripsi
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> 100%
            Transparan
          </span>
          <span className="flex items-center gap-1">
            <Leaf className="w-3.5 h-3.5 text-green-500" /> LIVON
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
