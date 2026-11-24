"use client";
import { useLanguage } from "@/context/LanguageContext";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plus, Search, Trash2, Users } from "lucide-react";
import { useToast } from "@/components/shared/AppToaster";
import { cn } from "@/components/ui/primitives";
import {
  assignIplBills,
  fetchBillingResidents,
} from "@/lib/admin-billing/admin-billing-api";
import { periodLabel, rupiah } from "@/lib/admin-billing/admin-billing-format";
import type { BillingResident } from "@/lib/admin-billing/admin-billing-types";
import {
  AdminDialog,
  focusRing,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./AdminBillingUi";

const ITEM_SUGGESTIONS = [
  "Keamanan",
  "Kebersihan & sampah",
  "Perawatan fasilitas umum",
  "Penerangan jalan",
  "Air bersih",
];

type ItemDraft = { key: number; label: string; amount: string };

function endOfMonth(period: string) {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(year, month, 0);
  return `${year}-${String(month).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function AdminIplAssignDialog({
  defaultPeriod,
  onClose,
  onDone,
}: {
  defaultPeriod: string;
  onClose: () => void;
  onDone: (period: string) => void;
}) {
  const { t: translateUi } = useLanguage();

  const toast = useToast();
  const [period, setPeriod] = useState(defaultPeriod);
  const [dueDate, setDueDate] = useState(endOfMonth(defaultPeriod));
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([
    { key: 1, label: "Iuran IPL", amount: "" },
  ]);
  const [target, setTarget] = useState<"ALL" | "PICK">("ALL");
  const [residents, setResidents] = useState<BillingResident[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setResidents(null);
    fetchBillingResidents(period)
      .then((data) => {
        if (!active) return;
        setResidents(data);
        setSelected((current) => {
          const next = new Set<string>();
          for (const id of current)
            if (data.some((r) => r.id === id && !r.hasBill)) next.add(id);
          return next;
        });
      })
      .catch((cause: Error) => active && setError(cause.message));
    return () => {
      active = false;
    };
  }, [period]);

  const total = items.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );
  const eligible = residents?.filter((r) => !r.hasBill) ?? [];
  const recipients = target === "ALL" ? eligible.length : selected.size;
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (residents ?? []).filter(
      (r) =>
        !term ||
        r.name.toLowerCase().includes(term) ||
        r.house.toLowerCase().includes(term),
    );
  }, [residents, search]);

  function updateItem(key: number, patch: Partial<ItemDraft>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  function addItem(label = "") {
    setItems((current) =>
      current.length >= 12
        ? current
        : [...current, { key: Date.now() + current.length, label, amount: "" }],
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const clean = items
      .map((item) => ({
        label: item.label.trim(),
        amount: Number(item.amount),
      }))
      .filter((item) => item.label || item.amount);
    if (
      !clean.length ||
      clean.some((item) => !item.label || !(item.amount > 0))
    )
      return setError("Setiap rincian butuh nama dan nominal lebih dari 0.");
    if (!recipients) return setError("Pilih minimal satu warga penerima.");
    const [year, month] = period.split("-").map(Number);
    setBusy(true);
    try {
      const result = await assignIplBills({
        month,
        year,
        dueDate,
        title: title.trim() || undefined,
        items: clean,
        userIds: target === "ALL" ? [] : [...selected],
      });
      toast.success(
        "Tagihan IPL diterbitkan",
        `${result.created} tagihan ${periodLabel(period)} dibuat${result.skipped ? `, ${result.skipped} dilewati karena sudah ada` : ""}.`,
      );
      onDone(period);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Gagal menerbitkan tagihan.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminDialog
      title={translateUi("Terbitkan tagihan IPL")}
      description={translateUi(
        "Tentukan nominal, rincian, dan warga yang ditagih.",
      )}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className={secondaryButtonClass}
          >
            {translateUi("Batal")}
          </button>
          <button
            type="submit"
            form="assign-ipl-form"
            disabled={busy || !recipients || total <= 0}
            className={primaryButtonClass}
          >
            {busy
              ? translateUi("Menerbitkan…")
              : translateUi("Terbitkan {0} tagihan · {1}", {
                  0: recipients,
                  1: rupiah(total),
                })}
          </button>
        </>
      }
    >
      <form
        id="assign-ipl-form"
        onSubmit={submit}
        className="space-y-6 px-5 py-5 sm:px-6"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {translateUi("Periode")}
            <input
              type="month"
              required
              value={period}
              onChange={(event) => {
                setPeriod(event.target.value);
                if (event.target.value)
                  setDueDate(endOfMonth(event.target.value));
              }}
              className={cn(inputClass, "mt-1.5 w-full")}
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {translateUi("Jatuh tempo")}
            <input
              type="date"
              required
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={cn(inputClass, "mt-1.5 w-full")}
            />
          </label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            {translateUi("Judul (opsional)")}
            <input
              value={title}
              maxLength={120}
              placeholder={translateUi("IPL {0}", {
                0: periodLabel(period || defaultPeriod),
              })}
              onChange={(event) => setTitle(event.target.value)}
              className={cn(inputClass, "mt-1.5 w-full")}
            />
          </label>
        </div>

        <fieldset className="min-w-0">
          <legend className="text-sm font-bold text-gray-900 dark:text-white">
            {translateUi("Rincian tagihan")}
          </legend>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-300">
            {translateUi("Total tagihan per rumah = jumlah semua rincian.")}
          </p>
          <div className="mt-3 space-y-2">
            {items.map((item, index) => (
              <div key={item.key} className="flex items-center gap-2">
                <label className="sr-only" htmlFor={`item-label-${item.key}`}>
                  {translateUi("Nama rincian ")}
                  {index + 1}
                </label>
                <input
                  id={`item-label-${item.key}`}
                  value={item.label}
                  maxLength={60}
                  placeholder={translateUi("Contoh: Keamanan")}
                  onChange={(event) =>
                    updateItem(item.key, { label: event.target.value })
                  }
                  className={cn(inputClass, "min-w-0 flex-1")}
                />
                <label className="sr-only" htmlFor={`item-amount-${item.key}`}>
                  {translateUi("Nominal rincian ")}
                  {index + 1}
                </label>
                <div className="relative w-36 shrink-0 sm:w-44">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    {translateUi("Rp")}
                  </span>
                  <input
                    id={`item-amount-${item.key}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={item.amount}
                    placeholder="0"
                    onChange={(event) =>
                      updateItem(item.key, { amount: event.target.value })
                    }
                    className={cn(
                      inputClass,
                      "w-full pl-9 text-right tabular-nums",
                    )}
                  />
                </div>
                <button
                  type="button"
                  aria-label={translateUi("Hapus rincian {0}", {
                    0: item.label || index + 1,
                  })}
                  disabled={items.length === 1}
                  onClick={() =>
                    setItems((current) =>
                      current.filter((row) => row.key !== item.key),
                    )
                  }
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30 dark:hover:bg-red-950",
                    focusRing,
                  )}
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => addItem()}
              className={cn(secondaryButtonClass, "h-9 px-3 text-xs")}
            >
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              {translateUi("Tambah rincian")}
            </button>
            {ITEM_SUGGESTIONS.filter(
              (label) => !items.some((item) => item.label === label),
            ).map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => addItem(label)}
                className={cn(
                  "h-8 rounded-full border border-dashed border-gray-300 px-3 text-xs font-medium text-gray-600 transition hover:border-green-500 hover:text-green-700 dark:border-gray-600 dark:text-gray-300",
                  focusRing,
                )}
              >
                + {translateUi(label)}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-green-50 px-4 py-3 dark:bg-green-950/40">
            <span className="text-sm font-medium text-green-900 dark:text-green-200">
              {translateUi("Total per rumah")}
            </span>
            <span className="text-lg font-black tabular-nums text-green-900 dark:text-white">
              {rupiah(total)}
            </span>
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="text-sm font-bold text-gray-900 dark:text-white">
            {translateUi("Ditagihkan ke")}
          </legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(
              [
                [
                  "ALL",
                  "Semua warga terverifikasi",
                  `${eligible.length} rumah belum punya tagihan periode ini`,
                ],
                [
                  "PICK",
                  "Pilih warga tertentu",
                  "Centang warga yang akan ditagih",
                ],
              ] as const
            ).map(([value, label, hint]) => (
              <label
                key={value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                  target === value
                    ? "border-green-600 bg-green-50 dark:border-green-500 dark:bg-green-950/40"
                    : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800",
                )}
              >
                <input
                  type="radio"
                  name="target"
                  value={value}
                  checked={target === value}
                  onChange={() => setTarget(value)}
                  className="mt-0.5 h-4 w-4 accent-green-700"
                />
                <span>
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                    {translateUi(label)}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-300">
                    {hint}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {target === "PICK" && (
            <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 border-b border-gray-100 p-2 dark:border-gray-800">
                <div className="relative flex-1">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="search"
                    aria-label={translateUi("Cari warga")}
                    placeholder={translateUi("Cari nama atau rumah…")}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className={cn(inputClass, "w-full pl-9")}
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSelected(
                      selected.size === eligible.length
                        ? new Set()
                        : new Set(eligible.map((r) => r.id)),
                    )
                  }
                  className={cn(
                    secondaryButtonClass,
                    "h-10 shrink-0 px-3 text-xs",
                  )}
                >
                  <Users aria-hidden="true" className="h-3.5 w-3.5" />
                  {selected.size === eligible.length && eligible.length
                    ? translateUi("Batal pilih")
                    : translateUi("Pilih semua")}
                </button>
              </div>
              <ul className="max-h-56 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
                {!residents ? (
                  <li className="px-4 py-6 text-center text-sm text-gray-500">
                    {translateUi("Memuat warga…")}
                  </li>
                ) : !filtered.length ? (
                  <li className="px-4 py-6 text-center text-sm text-gray-500">
                    {translateUi("Warga tidak ditemukan.")}
                  </li>
                ) : (
                  filtered.map((resident) => (
                    <li key={resident.id}>
                      <label
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5",
                          resident.hasBill
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                        )}
                      >
                        <input
                          type="checkbox"
                          disabled={resident.hasBill}
                          checked={selected.has(resident.id)}
                          onChange={(event) =>
                            setSelected((current) => {
                              const next = new Set(current);
                              if (event.target.checked) next.add(resident.id);
                              else next.delete(resident.id);
                              return next;
                            })
                          }
                          className="h-4 w-4 accent-green-700"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-gray-900 dark:text-white">
                            {resident.name}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-300">
                            {resident.house || translateUi("Rumah belum diisi")}
                          </span>
                        </span>
                        {resident.hasBill && (
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            {translateUi("Sudah ada tagihan")}
                          </span>
                        )}
                      </label>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </fieldset>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
          >
            {translateUi(error)}
          </p>
        )}
      </form>
    </AdminDialog>
  );
}
