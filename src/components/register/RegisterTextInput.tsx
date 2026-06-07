import type { InputHTMLAttributes } from "react";

type RegisterTextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  errorClassName?: string;
};

export function RegisterTextInput({
  error,
  className = "",
  errorClassName = "pl-4",
  ...props
}: RegisterTextInputProps) {
  return (
    <div>
      <input
        className={`h-12 w-full rounded-full border border-gray-300 bg-gray-50 px-5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white ${className}`}
        {...props}
      />
      {error && (
        <p className={`mt-1 text-[11px] text-red-500 ${errorClassName}`}>
          {error}
        </p>
      )}
    </div>
  );
}
