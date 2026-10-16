export async function logoutSession() {
  const token = localStorage.getItem("livon-token");
  localStorage.removeItem("livon-token");
  if (!token) return;

  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      keepalive: true,
    });
  } catch (error) {
    console.warn("Logout request failed", error);
  }
}
