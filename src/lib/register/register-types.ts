export type RegisterRole = "WARGA" | "AGENCY";

export type RegisterFormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  nomorKK: string;
  nik: string;
  blokRumah: string;
  noRumah: string;
  role: RegisterRole;
  agencyName: string;
  address: string;
  phone: string;
};

export type RegisterFormErrors = Partial<
  Record<keyof RegisterFormData | "general", string>
>;
