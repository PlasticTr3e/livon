"use client";
import { ComingSoon } from "@/components/ComingSoon";

export default function CommentMonitorPage() {
  return (
    <ComingSoon
      title="Monitor Komentar"
      description="Moderasi diskusi komunitas per proyek, deteksi sentimen, dan tangani laporan konten yang tidak sesuai dengan mudah dan efisien."
      features={[
        "Tampilan komentar lintas semua proyek",
        "Analisis sentimen otomatis (Positif/Negatif/Netral)",
        "Tandai & hapus komentar bermasalah",
        "Balas komentar langsung dari panel admin",
        "Filter berdasarkan proyek, tanggal, & sentimen",
      ]}
    />
  );
}
