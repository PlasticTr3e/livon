/**
 * Mock data untuk halaman Billing & Care (IPL + Kantong Donasi) di database lokal.
 *
 *   node scripts/seed-billing-mock.mjs                 # isi mock untuk semua akun WARGA
 *   node scripts/seed-billing-mock.mjs --email a@b.c   # isi mock tagihan hanya untuk satu akun
 *   node scripts/seed-billing-mock.mjs --state overdue # variasi IPL: unpaid (default) | overdue | waiting | paid
 *   node scripts/seed-billing-mock.mjs --clean         # bersihkan mock, pertahankan checkout nyata
 *
 * Tagihan menggunakan UUID dan penanda notes; order/ledger demo memakai ID mock-.
 * Checkout nyata yang sudah terkait tetap dipertahankan. Kedua saldo mengikuti ledger.
 */
import "dotenv/config";
import pg from "pg";
import { createHash } from "node:crypto";

const url = new URL(process.env.DATABASE_URL);
if (
  !["localhost", "127.0.0.1"].includes(url.hostname) ||
  !url.pathname.endsWith("-dev") ||
  process.env.NODE_ENV === "production"
) {
  throw new Error("Mock billing hanya boleh dijalankan ke database lokal.");
}

const args = process.argv.slice(2);
const clean = args.includes("--clean");
const emailIndex = args.indexOf("--email");
const onlyEmail = emailIndex >= 0 ? args[emailIndex + 1] : null;
if (emailIndex >= 0 && (!onlyEmail || onlyEmail.startsWith("--")))
  throw new Error("--email membutuhkan alamat akun warga.");
const stateIndex = args.indexOf("--state");
const iplState = stateIndex >= 0 ? args[stateIndex + 1] : "unpaid";
if (!["unpaid", "overdue", "waiting", "paid"].includes(iplState))
  throw new Error("--state harus unpaid, overdue, waiting, atau paid.");

// Prisma stores DateTime as UTC in "timestamp without time zone" columns.
pg.defaults.parseInputDatesAsUTC = true;
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

const DAY = 86_400_000;
const DEMO_BANKS = ["bca", "bni", "mandiri", "bri", "gopay", "qris"];
// Rincian tagihan IPL demo (total Rp 350.000).
const BILL_ITEMS = [
  { label: "Keamanan", amount: 150000 },
  { label: "Kebersihan & sampah", amount: 100000 },
  { label: "Perawatan fasilitas umum", amount: 75000 },
  { label: "Penerangan jalan", amount: 25000 },
];
const MOCK_NOTE = "[LIVON_BILLING_MOCK:v1] Data demo, bukan pembayaran nyata.";

function billUuid(label) {
  const bytes = createHash("sha256")
    .update("livon-billing-mock:" + label)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 80;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
const daysFromNow = (days, hour = 10) => {
  const date = new Date(Date.now() + days * DAY);
  date.setHours(hour, 0, 0, 0);
  return date;
};

async function removeMocks() {
  await client.query(
    `DELETE FROM financial_transactions WHERE id LIKE 'mock-income-%' OR id LIKE 'mock-expense-%'
      OR (id LIKE 'mock-ipl-income-%' AND ($1::text IS NULL OR "recordedById" IN (SELECT id FROM users WHERE email=$1)))`,
    [onlyEmail],
  );
  await client.query(
    `DELETE FROM payment_orders WHERE id LIKE 'mock-order-%'
      OR (id LIKE 'mock-iplorder-%' AND ($1::text IS NULL OR "userId" IN (SELECT id FROM users WHERE email=$1)))`,
    [onlyEmail],
  );
  // Keep any seeded bill already referenced by a real checkout or accounting entry.
  await client.query(
    `DELETE FROM resident_bills b WHERE (b.id LIKE 'mock-bill-%' OR b.notes = $1)
    AND ($2::text IS NULL OR b."userId" IN (SELECT id FROM users WHERE email=$2))
    AND NOT EXISTS (SELECT 1 FROM payment_orders p WHERE p."billId" = b.id)
    AND NOT EXISTS (SELECT 1 FROM financial_transactions t WHERE t."residentBillId" = b.id)`,
    [MOCK_NOTE, onlyEmail],
  );
}

/** Kedua saldo berasal dari pemasukan dan pengeluaran yang belum dihapus. */
async function recomputeSummaries() {
  await client.query(`
    INSERT INTO finance_summaries (id, "fundType", balance, "totalIncome", "totalExpense", "updatedAt")
    SELECT gen_random_uuid()::text, f, 0, 0, 0, now()
    FROM unnest(enum_range(NULL::"FundType")) f
    ON CONFLICT ("fundType") DO NOTHING
  `);
  await client.query(`
    UPDATE finance_summaries s SET
      "totalIncome"  = t.income,
      "totalExpense" = t.expense,
      balance        = t.income - t.expense,
      "updatedAt"    = now()
    FROM (
      SELECT
        "fundType",
        COALESCE(SUM(amount) FILTER (WHERE type = 'PEMASUKAN'), 0)   AS income,
        COALESCE(SUM(amount) FILTER (WHERE type = 'PENGELUARAN'), 0) AS expense
      FROM financial_transactions
      WHERE "deletedAt" IS NULL GROUP BY "fundType"
    ) t
    WHERE s."fundType" = t."fundType"
  `);
  await client.query(`UPDATE finance_summaries s SET balance=0, "totalIncome"=0, "totalExpense"=0, "updatedAt"=now()
    WHERE NOT EXISTS (SELECT 1 FROM financial_transactions t WHERE t."fundType"=s."fundType" AND t."deletedAt" IS NULL)`);
}

async function main() {
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('livon-billing-mock'))",
    );
    await client.query(
      'SELECT id FROM finance_summaries ORDER BY "fundType" FOR UPDATE',
    );
    await removeMocks();
    if (clean) {
      await recomputeSummaries();
      await client.query("COMMIT");
      console.log("Mock Billing & Care dihapus.");
      return;
    }

    const residents = (
      await client.query(
        `SELECT u.id, u.email, cp."fullName" AS name
           FROM users u LEFT JOIN citizen_profiles cp ON cp."userId" = u.id
          WHERE u.role = 'WARGA' AND u."deletedAt" IS NULL ${onlyEmail ? "AND u.email = $1" : ""}
          ORDER BY u.email`,
        onlyEmail ? [onlyEmail] : [],
      )
    ).rows;
    if (!residents.length)
      throw new Error(
        onlyEmail
          ? `Akun ${onlyEmail} tidak ditemukan.`
          : "Tidak ada akun WARGA di database.",
      );

    const admins = (
      await client.query(
        `SELECT u.id, COALESCE(ap."agencyName", u.email) AS name
           FROM users u LEFT JOIN agency_profiles ap ON ap."userId" = u.id
          WHERE u.role = 'AGENCY' ORDER BY u.email LIMIT 2`,
      )
    ).rows;
    if (!admins.length) throw new Error("Butuh minimal satu akun AGENCY.");

    /* ---------- Tagihan IPL per warga ---------- */
    const now = new Date();
    const period = (offset) => {
      const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      return { month: date.getMonth() + 1, year: date.getFullYear() };
    };
    const current = {
      unpaid: { status: "BELUM_BAYAR", due: null, paid: null }, // jatuh tempo akhir bulan
      overdue: { status: "BELUM_BAYAR", due: -5, paid: null }, // lewat 5 hari
      waiting: { status: "MENUNGGU_VERIFIKASI", due: null, paid: null },
      paid: { status: "LUNAS", due: null, paid: -2 },
    }[iplState];
    // 11 bulan terakhir lunas (dibayar tgl 25), bulan ini mengikuti --state.
    // Lebih dari 10 baris supaya paging riwayat tagihan & pembayaran terlihat.
    const billPlan = [
      ...Array.from({ length: 11 }, (_, index) => ({
        offset: index - 11,
        status: "LUNAS",
        due: "endOfMonth",
        paid: "day25",
      })),
      { offset: 0, ...current },
    ];
    let billCount = 0;
    let iplOrderCount = 0;
    for (const [residentIndex, resident] of residents.entries()) {
      // Variasi kedisiplinan supaya grafik admin terisi:
      // 0 tepat waktu, 1 selalu telat, 2 menunggak bulan lalu, 3 kadang telat.
      const habit = residentIndex % 4;
      for (const basePlan of billPlan) {
        const plan = { ...basePlan };
        if (plan.paid === "day25") {
          if (habit === 1 || (habit === 3 && plan.offset % 2 === 0))
            plan.paid = "lateNext3";
          if (habit === 2 && plan.offset === -1) {
            plan.status = "BELUM_BAYAR";
            plan.paid = null;
          }
        }
        const { month, year } = period(plan.offset);
        const endOfMonth = new Date(year, month, 0, 23, 59);
        const due =
          plan.due === null || plan.due === "endOfMonth"
            ? endOfMonth
            : daysFromNow(plan.due);
        const paidAt =
          plan.paid === null
            ? null
            : plan.paid === "day25"
              ? new Date(year, month - 1, 25, 10)
              : plan.paid === "lateNext3"
                ? new Date(year, month, 3, 19)
                : daysFromNow(plan.paid);
        const billId = billUuid(`${resident.id}:${year}:${month}`);
        const result = await client.query(
          `INSERT INTO resident_bills
             (id, "userId", title, month, year, amount, status, "dueDate", "paidAt", notes, items, "createdAt", "updatedAt")
           VALUES ($1, $2, '[DEMO] IPL', $3, $4, 350000, $5::"BillStatus", $6, $7, $8, $9::jsonb, now(), now())
           ON CONFLICT ("userId", month, year) DO NOTHING`,
          [
            billId,
            resident.id,
            month,
            year,
            plan.status,
            due,
            paidAt,
            MOCK_NOTE,
            JSON.stringify(BILL_ITEMS),
          ],
        );
        billCount += result.rowCount;

        // Riwayat pembayaran IPL untuk tagihan lunas yang baru dibuat.
        if (result.rowCount && plan.status === "LUNAS" && paidAt) {
          const label = new Date(year, month - 1, 1).toLocaleDateString(
            "id-ID",
            { month: "long", year: "numeric" },
          );
          await client.query(
            `INSERT INTO payment_orders
               (id, "requestKey", "userId", "billId", "fundType", amount, status, "payerName", title,
                anonymous, "paymentType", "paymentBank", "gatewayTransactionId", "expiresAt", "paidAt", "createdAt", "updatedAt")
             VALUES ($1, $1, $2, $3, 'IPL', 350000, 'PAID', $4, $5, false, 'demo', $7, $8, $6, $6, $6, $6)`,
            [
              `mock-iplorder-${resident.id}-${year}-${month}`,
              resident.id,
              billId,
              resident.name || resident.email.split("@")[0],
              `[DEMO] IPL ${label}`,
              paidAt,
              DEMO_BANKS[(residentIndex + month) % DEMO_BANKS.length],
              `DEMO-${billId.slice(0, 8).toUpperCase()}`,
            ],
          );
          await client.query(
            `INSERT INTO financial_transactions
            (id,title,description,amount,type,"fundType",category,"transactionDate","recordedById","residentBillId","paymentOrderId","createdAt","updatedAt")
            VALUES ($1,'[DEMO] Pembayaran IPL',$2,350000,'PEMASUKAN','IPL','Data demo',$3,$4,$5,$6,$3,$3)`,
            [
              `mock-ipl-income-${resident.id}-${year}-${month}`,
              MOCK_NOTE,
              paidAt,
              resident.id,
              billId,
              `mock-iplorder-${resident.id}-${year}-${month}`,
            ],
          );
          iplOrderCount += 1;
        }
      }
    }

    /* ---------- Donasi masuk ---------- */
    const donors = residents.length ? residents : [];
    const donorAt = (i) => donors[i % donors.length];
    const donations = [
      {
        days: 0,
        amount: 500000,
        anonymous: true,
        message: "Semoga lekas sembuh, Pak.",
      },
      { days: -1, amount: 100000, anonymous: false, message: null },
      {
        days: -3,
        amount: 250000,
        anonymous: false,
        message: "Untuk paket sembako lansia.",
      },
      { days: -6, amount: 50000, anonymous: true, message: null },
      {
        days: -9,
        amount: 1000000,
        anonymous: false,
        message: "Titip untuk kegiatan 17-an.",
      },
      { days: -14, amount: 150000, anonymous: false, message: null },
      {
        days: -21,
        amount: 300000,
        anonymous: true,
        message: "Semoga bermanfaat.",
      },
      { days: -30, amount: 750000, anonymous: false, message: null },
      { days: -33, amount: 200000, anonymous: false, message: null },
      {
        days: -38,
        amount: 100000,
        anonymous: true,
        message: "Sedikit dari kami.",
      },
      { days: -42, amount: 500000, anonymous: false, message: null },
      {
        days: -47,
        amount: 250000,
        anonymous: false,
        message: "Untuk warga yang membutuhkan.",
      },
      { days: -55, amount: 75000, anonymous: true, message: null },
    ];
    // Donasi lama tersebar Jan-Agu supaya grafik antusiasme admin terisi.
    // Pola sengaja naik-turun (mis. ramai menjelang Agustusan).
    const MONTHLY_DONATIONS = [3, 2, 4, 5, 3, 6, 9, 4];
    for (const [monthIndex, count] of MONTHLY_DONATIONS.entries()) {
      for (let n = 0; n < count; n += 1) {
        const at = new Date(
          now.getFullYear(),
          monthIndex,
          3 + n * 3,
          9 + (n % 8),
        );
        if (at >= now) continue;
        donations.push({
          at,
          amount: [50000, 100000, 150000, 200000, 250000][(monthIndex + n) % 5],
          anonymous: (monthIndex + n) % 4 === 0,
          message: null,
        });
      }
    }
    for (const [i, donation] of donations.entries()) {
      const donor = donorAt(i);
      const at = donation.at ?? daysFromNow(donation.days, 8 + (i % 10));
      const orderId = `mock-order-${i + 1}`;
      await client.query(
        `INSERT INTO payment_orders
           (id, "requestKey", "userId", "fundType", amount, status, "payerName", title, anonymous, message,
            "paymentType", "paymentBank", "gatewayTransactionId", "expiresAt", "paidAt", "createdAt", "updatedAt")
         VALUES ($1, $1, $2, 'DONASI', $3, 'PAID', $4, '[DEMO] Donasi kantong warga', $5, $6,
                 'demo', $8, $9, $7, $7, $7, $7)`,
        [
          orderId,
          donor.id,
          donation.amount,
          donation.anonymous
            ? "Anonim"
            : donor.name || donor.email.split("@")[0],
          donation.anonymous,
          `[DEMO] ${donation.message || "Contoh donasi warga"}`,
          at,
          DEMO_BANKS[i % DEMO_BANKS.length],
          `DEMO-DON-${String(i + 1).padStart(3, "0")}`,
        ],
      );
      await client.query(
        `INSERT INTO financial_transactions
           (id, title, description, amount, type, "fundType", category, "transactionDate",
            "recordedById", "paymentOrderId", "createdAt", "updatedAt")
         VALUES ($1, '[DEMO] Donasi warga', $2, $3, 'PEMASUKAN', 'DONASI', 'Data demo', $4, $5, $6, $4, $4)`,
        [
          `mock-income-${i + 1}`,
          donation.message,
          donation.amount,
          at,
          donation.anonymous ? null : donor.id,
          orderId,
        ],
      );
    }
    // Donasi tunai yang dicatat pengurus (tanpa pembayaran online).
    await client.query(
      `INSERT INTO financial_transactions
         (id, title, description, amount, type, "fundType", category, "transactionDate", "recordedById", "createdAt", "updatedAt")
       VALUES ('mock-income-cash-1', 'Donasi Kas Perumahan - Hamba Allah', '[DEMO] Contoh donasi tunai', 2000000, 'PEMASUKAN', 'DONASI',
               'Donasi Warga', $1, $2, $1, $1)`,
      [daysFromNow(-25), admins[0].id],
    );

    /* ---------- Penarikan / penyaluran oleh pengurus ---------- */
    const expenses = [
      {
        days: -2,
        title: "Bantuan biaya rumah sakit warga Blok C",
        category: "Bantuan kesehatan",
        description: "Membantu sebagian biaya rawat inap pasca operasi.",
        amount: 1500000,
      },
      {
        days: -12,
        title: "Paket sembako lansia",
        category: "Sosial",
        description: "20 paket sembako untuk warga lansia.",
        amount: 2000000,
      },
      {
        days: -27,
        title: "Santunan duka keluarga warga",
        category: "Santunan",
        description: null,
        amount: 750000,
      },
    ];
    for (const [i, expense] of expenses.entries()) {
      const at = daysFromNow(expense.days, 13);
      await client.query(
        `INSERT INTO financial_transactions
           (id, title, description, amount, type, "fundType", category, "transactionDate", "recordedById", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, 'PENGELUARAN', 'DONASI', $5, $6, $7, $6, $6)`,
        [
          `mock-expense-${i + 1}`,
          `[DEMO] ${expense.title}`,
          expense.description,
          expense.amount,
          expense.category,
          at,
          admins[i % admins.length].id,
        ],
      );
    }

    await recomputeSummaries();
    await client.query("COMMIT");
    console.log(
      `Mock dibuat: ${billCount} tagihan IPL (${iplOrderCount} pembayaran) untuk ${residents.length} warga, ` +
        `${donations.length + 1} donasi masuk, ${expenses.length} penyaluran.`,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
