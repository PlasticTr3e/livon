# Billing & Care

Dataset aktif sekarang mengikuti [lima kasus uji end-to-end](billing-test-cases.md). Data demo massal di bagian riwayat seed di bawah sudah dibersihkan atas permintaan pengguna; jangan menjalankan seed massal lagi untuk memakai kasus uji ini.

## Alur yang tersedia

- `/crowdfunding`: tagihan milik akun, riwayat pembayaran, saldo dana dan pengeluaran dari database. Daftar memiliki pagination; filter dana dijalankan di server.
- Pengelola AGENCY dapat menerbitkan tagihan bulanan untuk warga aktif terverifikasi, mencatat pengeluaran, serta memverifikasi/menolak bukti pembayaran manual.
- Halaman `/crowdfunding` memakai tampilan IPL dan Kantong Donasi yang sama untuk WARGA dan AGENCY; tagihan dan riwayat pribadi mengikuti pemilik akun. Billing & Care di dalam Management membuka kembali dashboard crowdfunding sebelumnya pada `/admin/crowdfunding`. Halaman dan menu Kelola Billing dihapus atas permintaan pengguna.
- `/crowdfunding/donasi`: nominal, pilihan anonim dan pesan tetap tersimpan dalam query ketika kembali dari review atau me-reload halaman.
- `/payment/ipl?bill=<id>` memakai nominal tagihan database milik pengguna. `/payment/donasi?...` memvalidasi nominal di server.
- Order disimpan sebelum meminta token Midtrans. Order pending dapat ditemukan kembali dari riwayat. `/payment/ipl?order=<id>` dan `/payment/donasi?order=<id>` hanya dapat dibuka pemiliknya.
- Status sukses harus dikonfirmasi server. Settlement secara atomik memperbarui order, tagihan, transaksi pemasukan, dan saldo dana. Row locking dan unique indexes mencegah pencatatan ganda.
- Bukti pembayaran dapat dibuka dan diunduh kembali dari riwayat. Unduhan berupa teks, bukan faktur pajak.
- Tidak ada saldo, pengeluaran, identitas donatur atau status lunas bawaan dari demo browser. LocalStorage tidak menjadi sumber kebenaran keuangan.

## Notifikasi Billing

- Inbox dan lonceng menerima `bill_unpaid`, `bill_overdue`, `payment_success`, serta `donation_success` milik akun tersebut. Evaluasi tagihan dilakukan saat `/api/notifications` dimuat/dipoll; perubahan deadline muncul saat inbox berikutnya dimuat, tanpa job harian terpisah.
- Konfirmasi pembayaran online membuat notifikasi dalam transaksi database yang sama dengan pencatatan kas. Verifikasi manual juga membuat notifikasi sukses. Pembayaran pending/gagal atau pembayaran ganda yang memerlukan review tidak diklaim berhasil.
- ID notifikasi deterministik mencegah pesan ganda pada polling, request paralel, atau callback berulang. Notifikasi yang sudah dibaca tidak diaktifkan ulang. Pengingat lama ditandai dibaca ketika lunas, masuk verifikasi, atau digantikan pengingat lewat jatuh tempo.
- Pembayaran dan donasi lunas yang sudah ada di database diisi ke inbox secara idempoten. Setelah status PAID tampil pada checkout, lonceng dimuat ulang; polling reguler tetap berjalan untuk event dari sesi lain.

## Konfigurasi Midtrans

`MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY` harus berasal dari environment merchant yang sama. Default `MIDTRANS_IS_PRODUCTION=false` menggunakan sandbox; script Snap dan API server memilih environment yang sama. Server key hanya dipakai server.

Daftarkan notification URL merchant ke endpoint HTTPS yang dapat dijangkau:

```text
https://<domain-livon>/api/finance/payments/webhook
```

Endpoint memverifikasi SHA-512 signature dan memeriksa status ke Midtrans sebelum menyelesaikan pencatatan. Respons gateway HTTP 200 dengan `status_code: 404` tetap dianggap belum memiliki status pembayaran. Capture dengan fraud challenge/deny tidak dianggap lunas.

Localhost tidak dapat menerima webhook langsung dari internet. Halaman order memeriksa status setiap lima detik saat pending, dan riwayat dapat dibuka untuk memeriksa lagi. Gangguan jaringan menampilkan status tersimpan dengan pesan bahwa sinkronisasi belum berhasil; bukan sukses buatan. Webhook mengembalikan error agar penyedia dapat mencoba ulang jika verifikasi status belum tersedia.

Order menggunakan expiry 24 jam yang dikirim ke gateway dengan waktu mulai yang sama. Tidak ada countdown palsu sebelum order dibuat. Menutup popup atau kembali ke hub tidak membatalkan transaksi gateway; gunakan riwayat untuk melanjutkan.

Pengembalian dana/chargeback bukan aksi yang tersedia di halaman ini. Rekonsiliasi refund merchant memerlukan alur tersendiri; jangan menganggap perubahan status refund sebagai pemasukan baru.

## Database dan migration

Migration `20261119010000_billing_finance_orders` membuat tabel finance yang hilang, order pembayaran, relasi, dan indexes tanpa mereset pengguna/database. SQL bisa dijalankan ulang untuk setup lokal tanpa mengubah data yang sudah ada. Kedua migration baru tanggal 19 November sudah diterapkan dan dicatat pada database lokal yang diperiksa.

Database lokal mempunyai riwayat migration lama yang gagal sebelum perubahan ini. Riwayat lama perlu diperiksa sebelum menjalankan deployment penuh dengan `prisma migrate deploy`; tidak diperbaiki dengan `migrate reset`. Konfigurasi DIRECT_URL lokal port 5432 juga dapat mengenai PostgreSQL Windows lain. Setup dan pengujian pekerjaan ini memakai koneksi Livon yang telah diverifikasi pada DATABASE_URL port 6432.

## Pengujian

Unit dan regresi:

```powershell
node --test tests/billing-payment.test.mjs tests/agency-role-auth.test.mjs tests/google-oauth-redirect.test.mjs tests/community-route-auth.test.mjs
```

Integrasi dengan database development lokal:

```powershell
node scripts/test-billing-integration.mjs
```

Script membuat Prisma client sementara di `tmp`, lalu menjalankan fixture pengguna/order/tagihan yang terisolasi. Fixture dan dampak akuntansinya dibersihkan menurut ID yang dibuat tes; data pengguna yang ada tidak dihapus. Gateway pada tes integrasi disimulasikan: tidak membuat pembayaran eksternal atau memindahkan uang. Pengujian penerbitan tagihan dijalankan di transaksi yang di-rollback, termasuk apabila warga asli ikut dalam query kandidat.

Cakupan: kepemilikan, nominal database, request ulang, lima settlement paralel, signature webhook, fraud challenge, nominal salah, donasi anonim, gateway gagal, order kedaluwarsa, recovery jaringan, verifikasi ganda, pengeluaran, dan penerbitan tagihan berulang tanpa perubahan tarif lama.

Browser lokal terisolasi juga telah digunakan untuk desktop/mobile, light/dark, radio keyboard, validasi nominal, review/back/reload, pending recovery, status lunas, unduhan bukti, payload form pengelola, dan endpoint verifikasi/penolakan bukti. Settlement pada uji browser disimulasikan di service dengan fixture; popup pembayaran aktual tidak dibayar.

Koneksi autentikasi Midtrans sandbox telah diverifikasi dengan request status read-only. Pada 19 November 2026, backend juga berhasil membuat order sandbox IPL Rp350.000 dan donasi Rp25.000. Popup Snap asli untuk keduanya telah dibuka sampai pilihan QRIS, virtual account, dan kartu tampil. Request berulang memakai order IPL yang sama; akun lain ditolak. Tidak ada pembayaran yang dikirim atau settlement merchant yang disimulasikan lewat portal Midtrans. Pengujian settlement dan webhook memakai fixture terpisah.

Build production berhasil mengompilasi, memeriksa TypeScript dan prerender halaman (exit 0), tetapi tracing standalone pada Windows masih memberi warning EINVAL untuk chunk bernama `node:buffer`. Paket standalone Windows tidak diklaim siap deploy; verifikasi packaging Docker/Linux dilakukan terpisah. Development lokal tidak memakai paket standalone tersebut.

## Mencoba akun demo lokal

1. Masuk sebagai `warga.demo@livon.test` / `warga123`, buka Billing & Care. Tab IPL menampilkan tagihan database; tab Kantong Donasi menampilkan kas dan donasi pribadi.
2. Pilih Bayar sekarang atau Donasi sekarang untuk membuat order sandbox. Order pending yang sudah dibuat saat verifikasi dapat dilanjutkan dari riwayat pada akun yang sama.
3. Masuk sebagai `agency.demo@livon.test` / `agency123` untuk menerbitkan tagihan, mencatat pengeluaran, dan memverifikasi/menolak bukti. Penerbitan ulang periode yang sama tidak menimpa tarif/tagihan lama.
4. Untuk menampilkan tombol Hubungi CS, isi `NEXT_PUBLIC_IPL_CS_WHATSAPP` atau `NEXT_PUBLIC_IPL_CS_PHONE` di konfigurasi lingkungan.

## Data demo database

```powershell
npm run db:seed:billing
# Variasi tagihan bulan berjalan, sebelum ada checkout nyata yang terkait:
npm run db:seed:billing -- --email warga.demo@livon.test --state overdue
# unpaid, overdue, waiting, paid
npm run db:seed:billing -- --clean
```

Script hanya berjalan pada PostgreSQL lokal dengan nama database berakhiran `-dev`, bukan production. Data diberi label `[DEMO]` dan penanda notes; ini bukan dana atau pembayaran nyata. Tidak menjalankan seed utama yang mengganti password pengguna.

Dataset lokal yang telah diisi: 60 tagihan (12 bulan untuk 5 warga aktif), 55 pembayaran IPL historis beserta ledger-nya, 13 donasi online contoh, satu donasi tunai, serta tiga pengeluaran donasi. Saldo IPL demo Rp19.250.000. Donasi masuk Rp6.225.000 dikurangi pengeluaran Rp4.250.000 menghasilkan saldo Rp1.975.000. Ada dua order sandbox pending terpisah untuk percobaan IPL/donasi; order pending belum menambah saldo.

Tagihan menggunakan UUID deterministik yang valid untuk endpoint checkout. Order historis diberi metode `demo`, bukan diklaim sebagai pembayaran Midtrans. Kedua ringkasan kas dihitung dari ledger. Seed diulang dalam transaksi dan tidak menggandakan data; sepuluh pengguna yang ada tetap dipertahankan. `--email` membatasi tagihan IPL, sedangkan dataset donasi contoh bersifat bersama.

Checkout nyata ber-ID `LIVON-...`, ledger non-demo, serta tagihan yang sudah terkait checkout/ledger nyata dipertahankan ketika seed diulang maupun dibersihkan. Karena itu `--clean` dapat menyisakan tagihan demo yang sudah dipakai oleh checkout nyata; jangan menghapus referensinya untuk memaksa status kosong.

Untuk notifikasi pembayaran ketika browser ditutup, webhook merchant tetap perlu diarahkan ke URL HTTPS publik aplikasi. Localhost tidak menerima notifikasi internet; sinkronisasi status saat halaman order dibuka tetap tersedia. Lihat [alur resmi Snap Midtrans](https://docs.midtrans.com/docs/snap-snap-integration-guide).

## Dashboard admin: `/admin/billing`

Menu "Billing & Care" di sidebar admin (khusus AGENCY). Semua data dari database lewat `/api/admin/billing/*` (403 untuk non-AGENCY).

- **IPL**: pilih periode; metrik total/sudah/belum dibayar dan persentase tepat waktu; grafik perkembangan 6 bulan (tepat waktu, telat bayar, menunggu verifikasi, nunggak, belum jatuh tempo); tabel status per warga (filter per status); riwayat pembayaran dengan filter hari/bulan/tahun; detail + cetak nota (`window.print`, hanya `.print-area` yang tercetak).
- **Terbitkan IPL**: periode, jatuh tempo, rincian tagihan (disimpan di `resident_bills.items`), untuk semua warga terverifikasi atau warga terpilih. Tagihan yang sudah ada di periode tersebut dilewati.
- **Kantong donasi**: total kas, donasi bulan ini, total terkumpul, sudah disalurkan; riwayat uang masuk/keluar dengan filter tanggal; form tarik dana (kebutuhan + detail wajib) memakai `POST /api/finance/transactions` dengan cek saldo terkunci, lalu tampil di "Uang keluar" warga.

Migration `20261120000000_billing_admin_details` menambah `resident_bills.items`, `payment_orders.paymentBank`, dan `payment_orders.gatewayTransactionId` (idempoten). Settlement Midtrans kini menyimpan bank/penerbit dan `transaction_id`. Setelah `prisma generate`, restart dev server karena client Prisma disimpan di `globalThis`.
