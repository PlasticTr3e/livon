/** Auth token saved at login; sent to the Snap server action. */
export function getStoredPaymentToken() {
  return localStorage.getItem("livon-token");
}
