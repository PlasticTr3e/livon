import type { RegisterFormData, RegisterFormErrors } from "./register-types";

export function createRegisterFormData(
  prefilledEmail = "",
  prefilledName = "",
): RegisterFormData {
  return {
    fullName: prefilledName,
    email: prefilledEmail,
    password: "",
    confirmPassword: "",
    nomorKK: "",
    nik: "",
    blokRumah: "",
    noRumah: "",
    role: "WARGA",
    phone: "",
  };
}

export function validateRegisterForm(formData: RegisterFormData) {
  const errors: RegisterFormErrors = {};

  if (!formData.fullName.trim()) errors.fullName = "Full name is required";
  if (!formData.email.trim()) errors.email = "Email is required";
  else if (!/\S+@\S+\.\S+/.test(formData.email))
    errors.email = "Email is invalid";

  if (!formData.password) errors.password = "Password is required";
  else if (formData.password.length < 6) {
    errors.password = "Password must be at least 6 characters";
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  if (!formData.phone.trim()) errors.phone = "Phone is required";
  else if (!/^\d{10,12}$/.test(formData.phone.trim())) {
    errors.phone = "Phone number must be 10-12 digits";
  }

  if (formData.role === "WARGA") {
    if (!formData.nomorKK.trim()) {
      errors.nomorKK = "Family Card Number is required";
    } else if (!/^\d{16}$/.test(formData.nomorKK.trim())) {
      errors.nomorKK = "Family Card Number must be 16 digits";
    }

    if (formData.nik && !/^\d{16}$/.test(formData.nik.trim())) {
      errors.nik = "NIK must be 16 digits";
    }

    if (!formData.blokRumah.trim()) errors.blokRumah = "Block is required";
    if (!formData.noRumah.trim()) errors.noRumah = "House Number is required";
  }

  return errors;
}

export function createRegisterPayload(formData: RegisterFormData) {
  return {
    email: formData.email,
    password: formData.password,
    role: formData.role,
    fullName: formData.fullName,
    phone: formData.phone,
    kkNumber: formData.nomorKK,
    nik: formData.nik,
    blockHouse: formData.blokRumah,
    houseNumber: formData.noRumah,
  };
}

export function hasRegisterErrors(errors: RegisterFormErrors) {
  return Object.keys(errors).length > 0;
}
