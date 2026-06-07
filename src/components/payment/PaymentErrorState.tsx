import { Button } from "@/components/ui/primitives";

type PaymentErrorStateProps = {
  onBack: () => void;
};

export function PaymentErrorState({ onBack }: PaymentErrorStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-slate-50 dark:bg-[#0B1120]">
      <p className="mb-2 font-medium text-gray-500">Project not found.</p>
      <Button
        onClick={onBack}
        variant="outline"
        className="border-green-300 text-green-700"
      >
        Back
      </Button>
    </div>
  );
}
