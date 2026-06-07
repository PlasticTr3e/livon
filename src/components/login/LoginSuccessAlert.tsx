import { Check } from "lucide-react";

type LoginSuccessAlertProps = {
  message: string;
};

export function LoginSuccessAlert({ message }: LoginSuccessAlertProps) {
  if (!message) return null;

  return (
    <div className="mb-4 animate-fade-in rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
      <div className="mb-1 flex items-center justify-center gap-1 font-bold">
        <Check className="h-4 w-4" />
        Registration Successful!
      </div>
      <p className="text-center">{message}</p>
    </div>
  );
}
