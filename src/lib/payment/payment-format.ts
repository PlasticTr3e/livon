export function formatDonationAmount(amount: number) {
  return amount.toLocaleString("id-ID");
}

export function formatCountdownTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

export function getPaymentReceiptTime() {
  return new Date().toLocaleString("en-US");
}
