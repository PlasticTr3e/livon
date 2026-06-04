import { Eye, EyeOff } from "lucide-react";
import { RegisterTextInput } from "./RegisterTextInput";

type RegisterPasswordInputProps = {
  placeholder: string;
  value: string;
  error?: string;
  isVisible: boolean;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
};

export function RegisterPasswordInput({
  placeholder,
  value,
  error,
  isVisible,
  onChange,
  onToggleVisibility,
}: RegisterPasswordInputProps) {
  return (
    <div>
      <div className="relative">
        <RegisterTextInput
          type={isVisible ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pr-12"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label={isVisible ? "Hide password" : "Show password"}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {error && <p className="mt-1 pl-4 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
