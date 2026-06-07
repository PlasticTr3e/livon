import { supabase } from "@/lib/supabase";

export function getNewsBucketName() {
  return process.env.NODE_ENV === "production"
    ? "livon-media-prod"
    : "livon-media-dev";
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function uploadAdminNewsImage(file: File) {
  try {
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}.${fileExt}`;
    const bucketName = getNewsBucketName();

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(`uploads/${fileName}`, file, {
        contentType: file.type,
        upsert: false,
      });

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(`uploads/${fileName}`);

      return publicUrl;
    }

    console.warn(
      "Supabase storage upload failed, falling back to data URL",
      uploadError,
    );
    return await readFileAsDataUrl(file);
  } catch (error) {
    console.warn(
      "Client-side image upload failed, falling back to data URL",
      error,
    );
    try {
      return await readFileAsDataUrl(file);
    } catch {
      return null;
    }
  }
}
