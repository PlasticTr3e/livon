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

export function validateRegisterField(
  field: keyof RegisterFormData,
  value: string,
  formData?: RegisterFormData,
): string | undefined {
  const trimmed = value.trim();

  switch (field) {
    case "phone":
      if (!trimmed) return undefined;
      if (!/^\d+$/.test(trimmed)) {
        return "Phone number must contain only digits";
      }
      if (trimmed.length > 13) {
        return "Phone number must be at most 13 digits";
      }
      return undefined;

    case "nomorKK":
      if (!trimmed) return undefined;
      if (!/^\d+$/.test(trimmed)) {
        return "Family Card Number must contain only digits";
      }
      if (trimmed.length !== 16) {
        return "Family Card Number must be exactly 16 digits";
      }
      return undefined;

    case "nik":
      if (!trimmed) return undefined;
      if (!/^\d+$/.test(trimmed)) {
        return "NIK must contain only digits";
      }
      if (trimmed.length !== 16) {
        return "NIK must be exactly 16 digits";
      }
      return undefined;

    case "email":
      if (!trimmed) return undefined;
      if (!/\S+@\S+\.\S+/.test(trimmed)) {
        return "Email is invalid";
      }
      return undefined;

    case "password":
      if (!value) return undefined;

    case "confirmPassword":
      if (!value) return undefined;
      if (formData && value !== formData.password) {
        return "Passwords do not match";
      }
      return undefined;

    default:
      return undefined;
  }
}

export function validateRegisterForm(formData: RegisterFormData) {
  const errors: RegisterFormErrors = {};

  if (!formData.fullName.trim()) errors.fullName = "Full name is required";
  if (!formData.email.trim()) errors.email = "Email is required";
  else if (!/\S+@\S+\.\S+/.test(formData.email))
    errors.email = "Email is invalid";

  if (!formData.password) errors.password = "Password is required";

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  if (!formData.phone.trim()) {
    errors.phone = "Phone is required";
  } else if (!/^\d+$/.test(formData.phone.trim())) {
    errors.phone = "Phone number must contain only digits";
  } else if (formData.phone.trim().length > 13) {
    errors.phone = "Phone number must be at most 13 digits";
  }

  if (formData.role === "WARGA") {
    if (!formData.nomorKK.trim()) {
      errors.nomorKK = "Family Card Number is required";
    } else if (!/^\d+$/.test(formData.nomorKK.trim())) {
      errors.nomorKK = "Family Card Number must contain only digits";
    } else if (formData.nomorKK.trim().length !== 16) {
      errors.nomorKK = "Family Card Number must be exactly 16 digits";
    }

    if (!formData.nik.trim()) {
      errors.nik = "NIK is required";
    } else if (!/^\d+$/.test(formData.nik.trim())) {
      errors.nik = "NIK must contain only digits";
    } else if (formData.nik.trim().length !== 16) {
      errors.nik = "NIK must be exactly 16 digits";
    }

    if (!formData.blokRumah.trim()) errors.blokRumah = "Block is required";
    if (!formData.noRumah.trim()) errors.noRumah = "House Number is required";
  }

  return errors;
}

export function isRegisterSubmitDisabled(
  formData: RegisterFormData,
  errors: RegisterFormErrors,
): boolean {
  if (hasRegisterErrors(errors)) return true;

  const phone = formData.phone.trim();
  if (!phone || !/^\d+$/.test(phone) || phone.length > 13) {
    return true;
  }

  if (formData.role === "WARGA") {
    const nomorKK = formData.nomorKK.trim();
    if (!nomorKK || !/^\d+$/.test(nomorKK) || nomorKK.length !== 16) {
      return true;
    }

    const nik = formData.nik.trim();
    if (!nik || !/^\d+$/.test(nik) || nik.length !== 16) {
      return true;
    }

    if (!formData.blokRumah.trim() || !formData.noRumah.trim()) {
      return true;
    }
  }

  if (
    !formData.fullName.trim() ||
    !formData.email.trim() ||
    !formData.password ||
    !formData.confirmPassword ||
    formData.password !== formData.confirmPassword
  ) {
    return true;
  }

  return false;
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
