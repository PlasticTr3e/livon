"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

// UI Components & Icons
import { Button, Card } from "@/components/ui/WireframePrimitives";
import { ArrowLeft, CheckCircle2, Shield, Clock, Leaf } from "lucide-react";

// --- TYPES ---
interface MidtransResult {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_status: string;
  pdf_url?: string;
  fraud_status?: string;
}

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: MidtransResult) => void;
          onPending?: (result: MidtransResult) => void;
          onError?: (result: MidtransResult) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

type Step = "confirm" | "success";

function PaymentContent() {
  // --- ROUTING & PARAMS ---
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const amount = parseInt(searchParams.get("amount") || "0");

  // Midtrans status from URL redirection
  const transactionStatus = searchParams.get("transaction_status");
  const isFromMidtransSuccess =
    transactionStatus === "settlement" || transactionStatus === "capture";

  // --- STATE ---
  const [project, setProject] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes countdown
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<Step>(
    isFromMidtransSuccess ? "success" : "confirm",
  );
  const [receipt, setReceipt] = useState<{
    orderId: string;
    time: string;
  } | null>({
    orderId: searchParams.get("order_id") || "",
    time: new Date().toLocaleString("en-US"),
  });

  // --- EFFECTS ---

  // Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    // Cleanup timer on unmount
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Fetch Project Details
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

  // --- HANDLERS ---

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("livon-token");
      if (!token) {
        alert("Please login to continue your donation.");
        setIsProcessing(false);
        return;
      }

      // Initiate donation transaction
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

      if (res.ok && result.success && result.data?.token) {
        // Trigger Midtrans Snap Popup
        window.snap.pay(result.data.token, {
          onSuccess: function (result: MidtransResult) {
            // Save receipt data and navigate to success step
            setReceipt({
              orderId: result.order_id,
              time: new Date().toLocaleString("en-US"),
            });
            setStep("success");
          },
          onPending: function () {
            alert(
              "Waiting for payment! Please complete your payment through the selected VA.",
            );
          },
          onError: function () {
            alert("Payment failed. Please try again.");
          },
          onClose: function () {
            alert("You closed the payment popup without completing it.");
          },
        });
      } else {
        alert(result.message || "Failed to process donation.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while processing the donation.");
    }
    setIsProcessing(false);
  };

  // --- RENDER ---

  // 1. Loading State
  if (isLoadingProject) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading payment...</p>
      </div>
    );
  }

  // 2. Error State (Project Not Found)
  if (!project) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <p className="text-gray-500 font-medium mb-2">Project not found.</p>
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="border-green-300 text-green-700"
        >
          Back
        </Button>
      </div>
    );
  }

  // 3. Success State
  if (step === "success") {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950 overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shadow-sm">
          <Link
            href="/crowdfunding"
            className="flex items-center text-green-600 dark:text-green-400 hover:text-green-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium text-sm">Back to Menu</span>
          </Link>
        </div>
        <div className="max-w-lg mx-auto px-4 py-16 text-center w-full">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-green-200">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-slate-100 mb-2">
            Donation Successful!
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
            Thank you for supporting{" "}
            <strong className="text-green-700 dark:text-green-400">
              {project.name}
            </strong>
            .<br />
            Your contribution means a lot to the community!
          </p>
          <Card className="p-5 border-green-200 mb-6 text-left">
            <div className="space-y-3">
              {[
                { label: "Project", value: project.name },
                {
                  label: "Donation Amount",
                  value: `Rp ${amount.toLocaleString("id-ID")}`,
                },
                {
                  label: "Transaction ID",
                  value: receipt?.orderId || "-",
                },
                { label: "Time", value: receipt?.time || "-" },
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
            <p className="font-semibold mb-1">Encourage others to donate!</p>
            <p className="text-xs text-green-600 dark:text-green-500">
              Invite your neighbors to donate and accelerate the realization of
              this project.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Confirm State (Default)
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* Top Navigation */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center text-green-600 hover:text-green-800 dark:text-green-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="font-medium text-sm">Back</span>
        </button>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 w-full space-y-5">
        {/* Donation Summary Card */}
        <Card className="p-5 border-2 border-green-200 bg-gradient-to-br from-green-700 to-green-900 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Leaf className="w-5 h-5 text-green-300" />
            <p className="text-xs font-bold text-green-300 uppercase tracking-widest">
              Donation Summary
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

        {/* Payment Confirmation Details */}
        {step === "confirm" && (
          <div className="space-y-4">
            <Card className="p-5 border-green-100">
              <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-4">
                Payment Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    Donation Amount
                  </span>
                  <span className="text-sm font-semibold dark:text-slate-200">
                    Rp {amount.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-slate-600">
                  <span className="font-bold text-gray-900 dark:text-slate-100">
                    Total Payment
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
                Complete payment within{" "}
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
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Confirm Payment
                </>
              )}
            </Button>
          </div>
        )}

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-5 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-green-500" /> SSL Encrypted
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> 100%
            Transparent
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
    <>
      {/* Midtrans Snap Script */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key="Mid-client-hathFuuCoigDRQ3Q"
        strategy="lazyOnload"
      />
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }
      >
        <PaymentContent />
      </Suspense>
    </>
  );
}
