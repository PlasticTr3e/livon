import { Eye, EyeOff } from "lucide-react";

type PasswordInputProps = {
  value: string;
  isVisible: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleVisibility: () => void;
};

export function PasswordInput({
  value,
  isVisible,
  onChange,
  onToggleVisibility,
}: PasswordInputProps) {
  return (
    <div className="relative">
      <input
        type={isVisible ? "text" : "password"}
        name="password"
        placeholder="Password"
        value={value}
        onChange={onChange}
        className="h-12 w-full rounded-full border border-gray-200 bg-slate-50 px-5 pr-12 text-sm text-gray-800 transition-colors placeholder:text-gray-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-400 dark:border-gray-800 dark:bg-[#1F2937] dark:text-white dark:placeholder:text-slate-500"
        required
      />
      <button
        type="button"
        onClick={onToggleVisibility}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-green-600 dark:text-white dark:hover:text-green-400"
        aria-label={isVisible ? "Hide password" : "Show password"}
      >
        {isVisible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
