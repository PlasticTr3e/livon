export function PaymentLoadingState() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-slate-50 dark:bg-[#0B1120]">
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
      <p className="font-medium text-gray-500">Loading payment...</p>
    </div>
  );
}
