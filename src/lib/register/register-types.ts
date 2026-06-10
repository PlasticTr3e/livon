export type RegisterRole = "WARGA";

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
  phone: string;
};

export type RegisterFormErrors = Partial<
  Record<keyof RegisterFormData | "general", string>
>;
