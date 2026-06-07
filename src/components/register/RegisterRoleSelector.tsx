import type { RegisterRole } from "@/lib/register/register-types";

type RegisterRoleSelectorProps = {
  value: RegisterRole;
  onChange: (role: RegisterRole) => void;
};

export function RegisterRoleSelector({
  value,
  onChange,
}: RegisterRoleSelectorProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-white">
        Role
      </label>
      <div className="flex gap-4">
        <label className="flex items-center">
          <input
            type="radio"
            name="role"
            value="WARGA"
            checked={value === "WARGA"}
            onChange={() => onChange("WARGA")}
            className="mr-2"
          />
          Resident
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name="role"
            value="AGENCY"
            checked={value === "AGENCY"}
            onChange={() => onChange("AGENCY")}
            className="mr-2"
          />
          Agency
        </label>
      </div>
    </div>
  );
}
