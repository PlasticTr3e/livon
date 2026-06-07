import type {
  RegisterFormData,
  RegisterFormErrors,
} from "@/lib/register/register-types";
import { RegisterTextInput } from "./RegisterTextInput";

type RegisterResidentFieldsProps = {
  formData: RegisterFormData;
  errors: RegisterFormErrors;
  onFieldChange: (field: keyof RegisterFormData, value: string) => void;
};

export function RegisterResidentFields({
  formData,
  errors,
  onFieldChange,
}: RegisterResidentFieldsProps) {
  return (
    <>
      <RegisterTextInput
        type="text"
        placeholder="Family Card Number (16 digits)"
        value={formData.nomorKK}
        onChange={(event) => onFieldChange("nomorKK", event.target.value)}
        error={errors.nomorKK}
      />

      <RegisterTextInput
        type="text"
        placeholder="NIK (16 digits, optional)"
        value={formData.nik}
        onChange={(event) => onFieldChange("nik", event.target.value)}
        error={errors.nik}
      />

      <div className="flex gap-2">
        <div className="flex-1">
          <RegisterTextInput
            type="text"
            placeholder="Block"
            value={formData.blokRumah}
            onChange={(event) => onFieldChange("blokRumah", event.target.value)}
            error={errors.blokRumah}
          />
        </div>
        <div className="w-28">
          <RegisterTextInput
            type="text"
            placeholder="House Number"
            value={formData.noRumah}
            onChange={(event) => onFieldChange("noRumah", event.target.value)}
            error={errors.noRumah}
            errorClassName="pl-2"
          />
        </div>
      </div>
    </>
  );
}
