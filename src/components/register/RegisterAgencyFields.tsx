import type {
  RegisterFormData,
  RegisterFormErrors,
} from "@/lib/register/register-types";
import { RegisterTextInput } from "./RegisterTextInput";

type RegisterAgencyFieldsProps = {
  formData: RegisterFormData;
  errors: RegisterFormErrors;
  onFieldChange: (field: keyof RegisterFormData, value: string) => void;
};

export function RegisterAgencyFields({
  formData,
  errors,
  onFieldChange,
}: RegisterAgencyFieldsProps) {
  return (
    <>
      <RegisterTextInput
        type="text"
        placeholder="Agency Name"
        value={formData.agencyName}
        onChange={(event) => onFieldChange("agencyName", event.target.value)}
        error={errors.agencyName}
        required
      />
      <RegisterTextInput
        type="text"
        placeholder="Address"
        value={formData.address}
        onChange={(event) => onFieldChange("address", event.target.value)}
        error={errors.address}
        required
      />
    </>
  );
}
