import test from "node:test";
import assert from "node:assert/strict";
import { loadSource } from "./helpers/payment-test-loader.mjs";
const { translate } = loadSource("src/lib/i18n/translate.ts");
const { messages } = loadSource("src/lib/i18n/messages.ts");

test("UI copy is Indonesian by default and has English equivalents", () => {
  assert.equal(translate("News & Updates", "id"), "Berita & Pembaruan");
  assert.equal(translate("Bayar sekarang", "en"), "Pay now");
  assert.equal(translate("Invalid credentials", "id"), "Email atau kata sandi salah");
  assert.equal(translate("BELUM_BAYAR", "en"), "Unpaid");
});
test("interpolation preserves user-written content without translating it", () => {
  assert.equal(translate("Photo by {0}", "id", { 0: "News & Updates" }), "Foto oleh News & Updates");
  assert.equal(translate("Managing details for \"{0}\"", "id", {0: "Project Management"}), 'Mengelola rincian "Project Management"');
  assert.equal(translate("Custom user-written title", "en"), "Custom user-written title");
});
test("persisted notification and relative-time messages translate on display", () => {
  assert.equal(translate("Pembayaran IPL sebesar Rp 203.000 telah dikonfirmasi. Tagihan Anda sudah lunas.", "en"), "Your community dues payment of Rp 203.000 has been confirmed. Your bill is paid.");
  assert.equal(translate("4 weeks ago", "id"), "4 minggu lalu");
  assert.equal(translate("2 hari lagi", "en"), "2 days left");
});
test("every dictionary entry retains all interpolation slots", () => {
  for (const [key,entry] of Object.entries(messages)) {
    const slots = value => [...new Set(value.match(/\{\d+\}/g) || [])].sort();
    assert.deepEqual(slots(entry.id), slots(entry.en), key);
  }
});
test("formatting uses Indonesian on the server and the selected browser locale", () => {
  assert.equal(loadSource("src/lib/i18n/display.ts").getDisplayLocale(), "id-ID");
  const browser = loadSource("src/lib/i18n/display.ts", {}, { document: { documentElement: {lang:"en"} } });
  assert.equal(browser.getDisplayLocale(), "en-GB");
});
