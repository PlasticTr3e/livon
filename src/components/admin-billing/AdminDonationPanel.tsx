"use client";
import { useLanguage } from "@/context/LanguageContext";

import dynamic from "next/dynamic";
import { useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  VenetianMask,
  Wallet,
} from "lucide-react";
import { useToast } from "@/components/shared/AppToaster";
import { cn } from "@/components/ui/primitives";
import { FinancePagination } from "@/components/crowdfunding/FinancePagination";
import {
  fetchDonationAdmin,
  withdrawDonation,
} from "@/lib/admin-billing/admin-billing-api";
import {
  bankLabel,
  dateTime,
  methodLabel,
  rupiah,
  shortDate,
  todayInput,
} from "@/lib/admin-billing/admin-billing-format";
import type {
  DonationAdminOverview,
  DonationLedger,
} from "@/lib/admin-billing/admin-billing-types";
import {
  AdminPanel,
  DayFilter,
  PeriodPicker,
  EmptyState,
  ErrorBlock,
  focusRing,
  inputClass,
  LoadingBlock,
  MetricCard,
  primaryButtonClass,
  tdClass,
  thClass,
} from "./AdminBillingUi";
import { useAdminAsync } from "./useAdminAsync";

const DonationTrendChart = dynamic(
  () => import("./AdminDonationChart").then((m) => m.DonationTrendChart),
  { ssr: false, loading: () => <LoadingBlock label="Memuat grafik…" /> },
);

const CATEGORY_SUGGESTIONS = [
  "Bantuan kesehatan",
  "Sosial",
  "Santunan",
  "Bencana",
  "Pendidikan",
  "Kegiatan warga",
];

const labelClass = "text-sm font-medium text-gray-700 dark:text-gray-200";

/** Form tarik dana: wajib isi kebutuhan & detailnya agar tampil di Uang keluar warga. */
function WithdrawForm({
  balance,
  onSaved,
}: {
  balance: number;
  onSaved: () => void;
}) {
  const { t: translateUi } = useLanguage();

  const toast = useToast();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const value = Number(amount) || 0;
  const over = value > balance;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (over || value <= 0) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      await withdrawDonation({
        title: String(data.get("title")).trim(),
        amount: value,
        category: String(data.get("category")).trim(),
        description: String(data.get("description")).trim(),
        proofUrl: String(data.get("proof") || "").trim() || null,
        transactionDate: String(data.get("date")),
      });
      form.reset();
      setAmount("");
      toast.success(
        "Penarikan tercatat",
        `${rupiah(value)} keluar dari kantong donasi dan tampil di Uang keluar warga.`,
      );
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Penarikan belum tersimpan.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminPanel
      title={translateUi("Tarik Dana")}
      description={translateUi(
        "Catat penyaluran dana donasi. Warga melihat rinciannya.",
      )}
      bodyClassName="p-5 sm:p-6"
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-950/40">
          <span className="text-sm text-blue-900 dark:text-blue-200">
            {translateUi("Saldo tersedia")}
          </span>
          <span className="font-black tabular-nums text-blue-900 dark:text-white">
            {rupiah(balance)}
          </span>
        </div>

        <label className={cn(labelClass, "block")}>
          {translateUi("Kebutuhan ")}
          <span className="text-red-600">*</span>
          <input
            name="title"
            required
            minLength={3}
            maxLength={255}
            placeholder={translateUi(
              "Contoh: Bantuan biaya rumah sakit warga Blok C",
            )}
            className={cn(inputClass, "mt-1.5 w-full")}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <label className={cn(labelClass, "block")}>
            {translateUi("Nominal ")}
            <span className="text-red-600">*</span>
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {translateUi("Rp")}
              </span>
              <input
                name="amount"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                aria-invalid={over}
                aria-describedby="withdraw-amount-hint"
                className={cn(
                  inputClass,
                  "w-full pl-9 tabular-nums",
                  over &&
                    "border-red-500 focus:border-red-500 focus:ring-red-100",
                )}
              />
            </div>
            <span
              id="withdraw-amount-hint"
              className={cn(
                "mt-1 block text-xs",
                over
                  ? "text-red-700 dark:text-red-400"
                  : "text-gray-500 dark:text-gray-300",
              )}
            >
              {over
                ? translateUi("Melebihi saldo (maks. {0})", {
                    0: rupiah(balance),
                  })
                : translateUi("Tidak boleh melebihi saldo")}
            </span>
          </label>
          <label className={cn(labelClass, "block")}>
            {translateUi("Tanggal ")}
            <span className="text-red-600">*</span>
            <input
              name="date"
              type="date"
              required
              defaultValue={todayInput()}
              max={todayInput()}
              className={cn(inputClass, "mt-1.5 w-full")}
            />
          </label>
        </div>

        <label className={cn(labelClass, "block")}>
          {translateUi("Kategori ")}
          <span className="text-red-600">*</span>
          <input
            name="category"
            required
            maxLength={100}
            list="withdraw-categories"
            placeholder={translateUi("Pilih atau ketik kategori")}
            className={cn(inputClass, "mt-1.5 w-full")}
          />
          <datalist id="withdraw-categories">
            {CATEGORY_SUGGESTIONS.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>

        <label className={cn(labelClass, "block")}>
          {translateUi("Detail keperluan ")}
          <span className="text-red-600">*</span>
          <textarea
            name="description"
            required
            minLength={10}
            maxLength={1000}
            rows={3}
            placeholder={translateUi(
              "Jelaskan dana dipakai untuk apa dan siapa penerimanya",
            )}
            className={cn(inputClass, "mt-1.5 h-auto w-full py-2")}
          />
        </label>

        <label className={cn(labelClass, "block")}>
          {translateUi("Tautan bukti (opsional)")}
          <input
            name="proof"
            type="url"
            placeholder="https://"
            className={cn(inputClass, "mt-1.5 w-full")}
          />
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
          >
            {translateUi(error)}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || over || value <= 0}
          className={cn(primaryButtonClass, "w-full")}
        >
          <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          {busy
            ? translateUi("Menyimpan…")
            : value > 0
              ? translateUi("Tarik {0}", { 0: rupiah(value) })
              : translateUi("Tarik dana")}
        </button>
        <p className="text-center text-xs text-gray-500 dark:text-gray-300">
          {translateUi("Tercatat atas nama akun pengurus yang sedang masuk.")}
        </p>
      </form>
    </AdminPanel>
  );
}

export function AdminDonationPanel({
  period,
  onPeriodChange,
}: {
  period: string;
  onPeriodChange: (period: string) => void;
}) {
  const { t: translateUi } = useLanguage();

  const [ledger, setLedger] = useState<DonationLedger>("IN");
  // "" = seluruh bulan periode; YYYY-MM-DD = satu hari di bulan itu.
  const [day, setDay] = useState("");
  const [page, setPage] = useState(1);
  const overview = useAdminAsync<DonationAdminOverview>(
    (signal) => fetchDonationAdmin({ ledger, period, day, page }, signal),
    [ledger, period, day, page],
  );
  const data = overview.data;
  const t = data?.totals;

  return (
    <div className="space-y-6">
      <PeriodPicker
        period={period}
        onChange={(next) => {
          onPeriodChange(next);
          setDay("");
          setPage(1);
        }}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 [&>*:first-child]:col-span-2 sm:[&>*:first-child]:col-span-1">
        <MetricCard
          icon={Wallet}
          tone="blue"
          label={translateUi("Total kas donasi")}
          value={t ? rupiah(t.balance) : "-"}
        />
        <MetricCard
          icon={ArrowDownLeft}
          tone="green"
          label={translateUi("Donasi masuk")}
          value={t ? rupiah(t.periodIn) : "-"}
          caption={
            t
              ? translateUi("{0} donasi bulan ini", { 0: t.periodInCount })
              : undefined
          }
        />
        <MetricCard
          icon={ArrowUpRight}
          tone="red"
          label={translateUi("Disalurkan")}
          value={t ? rupiah(t.periodOut) : "-"}
          caption={
            t
              ? translateUi("{0} penyaluran bulan ini", { 0: t.periodOutCount })
              : undefined
          }
        />
      </div>

      <AdminPanel
        title={
          Number(data?.year ?? period.slice(0, 4)) === new Date().getFullYear()
            ? translateUi("Antusiasme Donasi Tahun Ini")
            : translateUi("Antusiasme Donasi Tahun {0}", {
                0: data?.year ?? period.slice(0, 4),
              })
        }
        bodyClassName="p-4 sm:p-6"
      >
        {overview.error ? (
          <ErrorBlock message={overview.error} onRetry={overview.reload} />
        ) : data ? (
          data.trend.some((point) => point.count > 0) ? (
            <DonationTrendChart data={data.trend} selectedPeriod={period} />
          ) : (
            <EmptyState
              title={translateUi("Belum ada donasi tahun ini")}
              text="Grafik akan terisi begitu warga mulai berdonasi."
            />
          )
        ) : (
          <LoadingBlock label={translateUi("Memuat grafik…")} />
        )}
      </AdminPanel>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <AdminPanel
          title={translateUi("Riwayat Kas Donasi")}
          className="xl:col-span-2"
          aside={
            <>
              <div
                role="group"
                aria-label={translateUi("Jenis transaksi")}
                className="grid w-full grid-cols-2 rounded-lg border border-gray-200 bg-gray-50 p-0.5 sm:inline-flex sm:w-auto dark:border-gray-700 dark:bg-[#111827]"
              >
                {(
                  [
                    ["IN", "Uang masuk", ArrowDownLeft],
                    ["OUT", "Uang keluar", ArrowUpRight],
                  ] as const
                ).map(([value, label, Icon]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={ledger === value}
                    onClick={() => {
                      setLedger(value);
                      setPage(1);
                    }}
                    className={cn(
                      "inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold transition sm:h-9",
                      focusRing,
                      ledger === value
                        ? "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-300",
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "h-3.5 w-3.5",
                        ledger === value &&
                          (value === "IN" ? "text-green-600" : "text-red-600"),
                      )}
                    />
                    {translateUi(label)}
                  </button>
                ))}
              </div>
              <DayFilter
                period={period}
                day={day}
                onChange={(next) => {
                  setDay(next);
                  setPage(1);
                }}
              />
            </>
          }
        >
          {overview.error ? (
            <ErrorBlock message={overview.error} onRetry={overview.reload} />
          ) : !data ? (
            <LoadingBlock label={translateUi("Memuat riwayat…")} />
          ) : ledger === "IN" ? (
            data.inRows.length ? (
              <>
                <ul
                  className={cn(
                    "divide-y divide-gray-100 xl:hidden dark:divide-gray-800",
                    overview.loading && "opacity-60",
                  )}
                >
                  {data.inRows.map((row) => (
                    <li key={row.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="flex min-w-0 items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
                          {row.anonymous && (
                            <VenetianMask
                              aria-hidden="true"
                              className="h-3.5 w-3.5 shrink-0 text-gray-500"
                            />
                          )}
                          <span className="break-words">
                            {row.donorName}
                            {row.realName && (
                              <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-300">
                                ({row.realName})
                              </span>
                            )}
                          </span>
                        </p>
                        <p className="shrink-0 font-bold tabular-nums text-green-700 dark:text-green-400">
                          +{rupiah(row.amount)}
                        </p>
                      </div>
                      {row.message && (
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                          “{row.message}”
                        </p>
                      )}
                      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-300">
                        <span>{dateTime(row.date)}</span>
                        {row.method && <span>{methodLabel(row.method)}</span>}
                        {row.bank && (
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                            {bankLabel(row.bank)}
                          </span>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
                <div
                  className={cn(
                    "hidden overflow-x-auto xl:block",
                    overview.loading && "opacity-60",
                  )}
                >
                  <table className="w-full min-w-[640px]">
                    <thead className="border-b border-gray-100 dark:border-gray-800">
                      <tr>
                        <th scope="col" className={thClass}>
                          {translateUi("Tanggal")}
                        </th>
                        <th scope="col" className={thClass}>
                          {translateUi("Donatur")}
                        </th>
                        <th scope="col" className={thClass}>
                          {translateUi("Metode")}
                        </th>
                        <th scope="col" className={cn(thClass, "text-right")}>
                          {translateUi("Nominal")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {data.inRows.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                        >
                          <td
                            className={cn(
                              tdClass,
                              "whitespace-nowrap text-gray-600 dark:text-gray-300",
                            )}
                          >
                            {dateTime(row.date)}
                          </td>
                          <td className={tdClass}>
                            <p className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-white">
                              {row.anonymous && (
                                <VenetianMask
                                  aria-hidden="true"
                                  className="h-3.5 w-3.5 text-gray-500"
                                />
                              )}
                              {row.donorName}
                              {row.realName && (
                                <span className="text-xs font-normal text-gray-500 dark:text-gray-300">
                                  ({row.realName})
                                </span>
                              )}
                            </p>
                            {row.message && (
                              <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500 dark:text-gray-300">
                                “{row.message}”
                              </p>
                            )}
                          </td>
                          <td
                            className={cn(
                              tdClass,
                              "text-gray-700 dark:text-gray-200",
                            )}
                          >
                            {row.method ? (
                              <>
                                {methodLabel(row.method)}
                                <span className="ml-1.5 rounded-md bg-gray-100 px-1.5 py-0.5 text-xs font-semibold dark:bg-gray-800">
                                  {bankLabel(row.bank)}
                                </span>
                              </>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td
                            className={cn(
                              tdClass,
                              "text-right font-bold tabular-nums text-green-700 dark:text-green-400",
                            )}
                          >
                            +{rupiah(row.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <EmptyState
                title={translateUi("Belum ada donasi")}
                text="Tidak ada donasi masuk pada rentang waktu ini."
              />
            )
          ) : data.outRows.length ? (
            <>
              <ul
                className={cn(
                  "divide-y divide-gray-100 xl:hidden dark:divide-gray-800",
                  overview.loading && "opacity-60",
                )}
              >
                {data.outRows.map((row) => (
                  <li key={row.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 font-semibold text-gray-900 dark:text-white">
                        {row.title}
                      </p>
                      <p className="shrink-0 font-bold tabular-nums text-red-600 dark:text-red-400">
                        −{rupiah(row.amount)}
                      </p>
                    </div>
                    {row.category && (
                      <span className="mt-1 inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {row.category}
                      </span>
                    )}
                    {row.description && (
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        {row.description}
                      </p>
                    )}
                    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-300">
                      <span>{shortDate(row.date)}</span>
                      <span>
                        {translateUi("Ditarik oleh ")}
                        {row.admin}
                      </span>
                      {row.proofUrl && (
                        <a
                          href={row.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            "inline-flex min-h-8 items-center gap-1 font-semibold text-blue-700 dark:text-blue-400",
                            focusRing,
                          )}
                        >
                          <FileText
                            aria-hidden="true"
                            className="h-3.5 w-3.5"
                          />
                          {translateUi("Bukti")}
                        </a>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
              <div
                className={cn(
                  "hidden overflow-x-auto xl:block",
                  overview.loading && "opacity-60",
                )}
              >
                <table className="w-full min-w-[640px]">
                  <thead className="border-b border-gray-100 dark:border-gray-800">
                    <tr>
                      <th scope="col" className={thClass}>
                        {translateUi("Tanggal")}
                      </th>
                      <th scope="col" className={thClass}>
                        {translateUi("Kebutuhan")}
                      </th>
                      <th scope="col" className={thClass}>
                        {translateUi("Ditarik oleh")}
                      </th>
                      <th scope="col" className={cn(thClass, "text-right")}>
                        {translateUi("Nominal")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {data.outRows.map((row) => (
                      <tr
                        key={row.id}
                        className="align-top hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                      >
                        <td
                          className={cn(
                            tdClass,
                            "whitespace-nowrap text-gray-600 dark:text-gray-300",
                          )}
                        >
                          {shortDate(row.date)}
                        </td>
                        <td className={tdClass}>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {row.title}
                          </p>
                          {row.category && (
                            <span className="mt-1 inline-block rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                              {row.category}
                            </span>
                          )}
                          {row.description && (
                            <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-300">
                              {row.description}
                            </p>
                          )}
                          {row.proofUrl && (
                            <a
                              href={row.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={cn(
                                "mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400",
                                focusRing,
                              )}
                            >
                              <FileText
                                aria-hidden="true"
                                className="h-3.5 w-3.5"
                              />
                              {translateUi("Bukti")}
                            </a>
                          )}
                        </td>
                        <td
                          className={cn(
                            tdClass,
                            "text-gray-700 dark:text-gray-200",
                          )}
                        >
                          {row.admin}
                        </td>
                        <td
                          className={cn(
                            tdClass,
                            "text-right font-bold tabular-nums text-red-600 dark:text-red-400",
                          )}
                        >
                          −{rupiah(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <EmptyState
              title={translateUi("Belum ada penarikan")}
              text="Tidak ada dana yang ditarik pada rentang waktu ini."
            />
          )}
          {data && (
            <div className="px-5 pb-4 sm:px-6">
              <FinancePagination
                label={
                  ledger === "IN"
                    ? translateUi("uang masuk")
                    : translateUi("uang keluar")
                }
                {...data.pagination}
                onPage={setPage}
              />
            </div>
          )}
        </AdminPanel>

        <WithdrawForm
          balance={t?.balance ?? 0}
          onSaved={() => {
            setLedger("OUT");
            setPage(1);
            overview.reload();
          }}
        />
      </div>
    </div>
  );
}
