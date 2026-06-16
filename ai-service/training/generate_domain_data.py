import csv
import os
from collections import Counter

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT_DIR, "smsa-ind-classification", "data")

LABELED_DATA: list[tuple[str, str]] = [
    ("ga guna jelek", "negative"),
    ("gak guna jelek", "negative"),
    ("tidak berguna dan jelek", "negative"),
    ("proyek ini ga penting banget masih banyak kebutuhan lain", "negative"),
    ("proyek ini tidak penting dibanding jalan rusak", "negative"),
    ("buat apa proyek begini kalau warga tidak butuh", "negative"),
    ("ini terlalu menghabiskan anggaran", "negative"),
    ("anggaran habis buat proyek yang tidak jelas manfaatnya", "negative"),
    ("ganggu banget ga berguna", "negative"),
    ("pembangunan ini malah mengganggu aktivitas warga", "negative"),
    ("mending anggarannya buat yang lebih penting", "negative"),
    ("uang rakyat habis buat proyek yang ga jelas manfaatnya", "negative"),
    ("pembangunan saluran air belum memadai dan masih banjir", "negative"),
    ("jalan masih rusak parah tapi malah bangun proyek lain", "negative"),
    ("kualitas pekerjaannya jelek dan cepat rusak lagi", "negative"),
    ("sangat dibutuhkan", "positive"),
    ("ini sangat dibutuhkan warga", "positive"),
    ("untuk sekarang urgent jadi sangat dibutuhkan", "positive"),
    ("bagus tolong kembangkan", "positive"),
    ("bagus nih buat orang orang ibadah", "positive"),
    ("bagus ya prioritaskan", "positive"),
    ("proyek yang bagus", "positive"),
    ("kerja bagus lanjutkan", "positive"),
    ("keren", "positive"),
    ("alhamdulillah sudah saatnya ini jalan dibangun", "positive"),
    ("pembangunan saluran air yang memadai akan sangat membantu warga", "positive"),
    ("semoga proyek ini benar benar bermanfaat", "positive"),
    ("lanjutkan program yang bermanfaat untuk warga", "positive"),
    ("terima kasih sudah memprioritaskan kebutuhan warga", "positive"),
    ("semoga aja beneran", "neutral"),
    ("b aja", "neutral"),
    ("biasa aja", "neutral"),
    ("buat proyek yang penting dikit dong", "neutral"),
    ("apakah proyek ini sudah masuk anggaran tahun ini", "neutral"),
    ("kapan proyek ini mulai dikerjakan", "neutral"),
    ("berapa biaya pembangunan proyek ini", "neutral"),
    ("saya ingin tahu jadwal pengerjaan proyek", "neutral"),
    ("pembangunan sedang dalam tahap perencanaan", "neutral"),
    ("informasi proyek akan diumumkan minggu depan", "neutral"),
]


def main() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    output_path = os.path.join(DATA_DIR, "domain_specific.csv")

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["texts", "labels"])
        writer.writerows(LABELED_DATA)

    label_counts = Counter(label for _, label in LABELED_DATA)
    total = len(LABELED_DATA)

    print(f"saved {total} samples -> {output_path}")
    print("\nlabel distribution:")
    for label, count in sorted(label_counts.items()):
        print(f"  {label:>10}: {count:>4} ({count / total:.1%})")


if __name__ == "__main__":
    main()
