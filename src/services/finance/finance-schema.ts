import { z } from "zod";
import { FundType } from "@/generated/prisma/enums";

export const createExpenseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Judul pengeluaran minimal 3 karakter")
    .max(255, "Judul pengeluaran maksimal 255 karakter"),
  description: z
    .string()
    .trim()
    .max(1000, "Deskripsi maksimal 1000 karakter")
    .optional()
    .nullable(),
  amount: z
    .number({ message: "Nominal pengeluaran harus berupa angka" })
    .positive("Nominal pengeluaran harus berupa angka positif")
    .min(1, "Nominal pengeluaran minimal Rp 1"),
  fundType: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        const u = val.toUpperCase();
        if (u === "DONATION") return FundType.DONASI;
        if (u === "DONASI") return FundType.DONASI;
        if (u === "IPL") return FundType.IPL;
      }
      return val;
    },
    z.nativeEnum(FundType, {
      message: "Jenis dana tidak valid. Pilihan: IPL atau DONASI (DONATION)",
    }),
  ),
  category: z
    .string()
    .trim()
    .min(1, "Kategori pengeluaran wajib diisi")
    .max(100, "Kategori pengeluaran maksimal 100 karakter"),
  proofUrl: z
    .string()
    .url("Format URL bukti kuitansi/struk tidak valid")
    .optional()
    .nullable(),
  transactionDate: z.coerce.date().optional(),
});

export const transactionQuerySchema = z.object({
  fundType: z.string().trim().optional(),
  type: z.string().trim().optional(),
  category: z.string().trim().optional(),
  search: z.string().trim().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;
