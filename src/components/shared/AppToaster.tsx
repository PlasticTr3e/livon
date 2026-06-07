"use client";

import * as Toast from "@radix-ui/react-toast";
import { X, AlertCircle, CheckCircle2, Info } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/components/ui/primitives";

type ToastVariant = "error" | "success" | "info";

type ToastPayload = {
  description?: string;
  title: string;
  variant?: ToastVariant;
};

type ToastItem = Required<ToastPayload> & {
  id: string;
};

type ToastContextValue = {
  show: (toast: ToastPayload) => void;
  error: (title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_STYLES: Record<
  ToastVariant,
  {
    accent: string;
    icon: typeof AlertCircle;
    iconColor: string;
  }
> = {
  error: {
    accent:
      "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/40",
    icon: AlertCircle,
    iconColor: "text-red-600 dark:text-red-300",
  },
  success: {
    accent:
      "border-green-200 bg-green-50 dark:border-green-900/60 dark:bg-green-950/40",
    icon: CheckCircle2,
    iconColor: "text-green-700 dark:text-green-300",
  },
  info: {
    accent:
      "border-blue-200 bg-blue-50 dark:border-blue-900/60 dark:bg-blue-950/40",
    icon: Info,
    iconColor: "text-blue-700 dark:text-blue-300",
  },
};

export function AppToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((toast: ToastPayload) => {
    const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now());

    setToasts((currentToasts) => [
      ...currentToasts,
      {
        description: toast.description ?? "",
        id,
        title: toast.title,
        variant: toast.variant ?? "info",
      },
    ]);
  }, []);

  const dismiss = useCallback((toastId: string) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId),
    );
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      error: (title, description) =>
        show({ description, title, variant: "error" }),
      success: (title, description) =>
        show({ description, title, variant: "success" }),
      info: (title, description) =>
        show({ description, title, variant: "info" }),
    }),
    [show],
  );

  return (
    <Toast.Provider swipeDirection="right" duration={4500}>
      <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
      {toasts.map((toast) => (
        <AppToast key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
      <Toast.Viewport className="fixed left-1/2 top-4 z-[2147483647] flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 flex-col gap-3 outline-none sm:top-6 sm:w-full" />
    </Toast.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside AppToasterProvider");
  }

  return context;
}

function AppToast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (toastId: string) => void;
}) {
  const styles = TOAST_STYLES[toast.variant];
  const Icon = styles.icon;

  return (
    <Toast.Root
      className={cn(
        "livon-toast grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-xl border p-4 shadow-xl shadow-black/10 backdrop-blur-md",
        styles.accent,
      )}
      onOpenChange={(isOpen) => {
        if (!isOpen) onDismiss(toast.id);
      }}
    >
      <Icon className={cn("mt-0.5 h-5 w-5", styles.iconColor)} />
      <div className="min-w-0">
        <Toast.Title className="text-sm font-bold text-gray-900 dark:text-white">
          {toast.title}
        </Toast.Title>
        {toast.description && (
          <Toast.Description className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-200">
            {toast.description}
          </Toast.Description>
        )}
      </div>
      <Toast.Close className="rounded-full p-1 text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white">
        <X className="h-4 w-4" />
      </Toast.Close>
    </Toast.Root>
  );
}
