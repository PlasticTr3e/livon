export async function uploadAdminNewsImage(file: File) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("livon-token") ?? ""}`,
      },
      body: formData,
    });
    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.data?.url) {
      console.warn("News image upload failed", json?.message);
      return null;
    }

    return json.data.url as string;
  } catch (error) {
    console.warn("News image upload failed", error);
    return null;
  }
}
