/**
 * Kontak customer service developer perumahan untuk urusan IPL.
 * IPL saat ini dikelola developer, jadi tagihan yang lewat jatuh tempo
 * harus dikonfirmasi lewat CS ini.
 */
const rawWhatsapp = process.env.NEXT_PUBLIC_IPL_CS_WHATSAPP ?? "";
const rawPhone = process.env.NEXT_PUBLIC_IPL_CS_PHONE ?? rawWhatsapp;

function digits(value: string) {
  const onlyDigits = value.replace(/\D/g, "");
  return onlyDigits.startsWith("0") ? "62" + onlyDigits.slice(1) : onlyDigits;
}

export const IPL_CS = {
  name: process.env.NEXT_PUBLIC_IPL_CS_NAME || "Customer Service Perumahan",
  whatsapp: digits(rawWhatsapp),
  phone: rawPhone.trim(),
};

export function iplWhatsappLink(message: string) {
  if (!IPL_CS.whatsapp) return null;
  return `https://wa.me/${IPL_CS.whatsapp}?text=${encodeURIComponent(message)}`;
}
