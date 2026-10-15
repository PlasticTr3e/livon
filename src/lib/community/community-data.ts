import type { CommunityAuthor, CommunityPost } from "./community-types";

const sari: CommunityAuthor = { name: "Sari Dewi", role: "resident" };
const budi: CommunityAuthor = { name: "Budi Santoso", role: "resident" };
const ahmad: CommunityAuthor = { name: "Ahmad Fauzi", role: "agency" };
const rina: CommunityAuthor = { name: "Rina Kusuma", role: "resident" };
const yusuf: CommunityAuthor = { name: "Yusuf Prasetyo", role: "resident" };

function unsplash(photoId: string, height = 500) {
  return `https://images.unsplash.com/${photoId}?w=800&h=${height}&fit=crop&auto=format`;
}

// Placeholder feed until the community API is available.
export const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    author: sari,
    timeLabel: "5 menit lalu",
    content:
      "Senang melihat perkembangan renovasi taman RT 04 yang sudah mulai terlihat hasilnya. Area bermain anak sudah dipasang dan cat baru sudah mulai diaplikasikan. Semoga bisa selesai tepat waktu sebelum akhir bulan! 🌿",
    images: [unsplash("photo-1519331379826-f10be5486c6f")],
    likeCount: 24,
    isLiked: false,
    comments: [
      {
        id: "comment-101",
        author: budi,
        timeLabel: "3 menit lalu",
        content: "Wah keren! Kapan kira-kira bisa dipakai ya, Bu?",
        likeCount: 5,
        isLiked: false,
        replies: [
          {
            id: "reply-1011",
            author: sari,
            timeLabel: "1 menit lalu",
            content:
              "Rencananya akhir bulan ini sudah bisa digunakan! Doakan ya 😊",
            likeCount: 3,
            isLiked: false,
          },
        ],
      },
      {
        id: "comment-102",
        author: ahmad,
        timeLabel: "2 menit lalu",
        content:
          "Terima kasih atas laporannya. Kami pastikan selesai sebelum jadwal.",
        likeCount: 9,
        isLiked: true,
        replies: [],
      },
    ],
  },
  {
    id: "post-2",
    author: budi,
    timeLabel: "1 jam lalu",
    content:
      "Kondisi jalan di Gang Mawar masih memprihatinkan setelah hujan kemarin. Lubang di depan rumah No.12 semakin besar dan membahayakan pengendara motor. Mohon perhatian dari pihak pengelola untuk segera ditindaklanjuti.",
    images: [
      unsplash("photo-1558618666-fcd25c85cd64"),
      unsplash("photo-1548625149-fc4a29cf7092"),
      unsplash("photo-1504307651254-35680f356dfd"),
    ],
    likeCount: 41,
    isLiked: false,
    comments: [
      {
        id: "comment-201",
        author: rina,
        timeLabel: "45 menit lalu",
        content:
          "Sudah dilaporkan ke pak RT minggu lalu tapi belum ada tindak lanjut juga.",
        likeCount: 12,
        isLiked: false,
        replies: [
          {
            id: "reply-2011",
            author: ahmad,
            timeLabel: "30 menit lalu",
            content:
              "Kami sudah terima laporannya. Tim akan survei lokasi besok pagi.",
            likeCount: 7,
            isLiked: false,
          },
          {
            id: "reply-2012",
            author: budi,
            timeLabel: "25 menit lalu",
            content: "Terima kasih Pak Ahmad, ditunggu ya!",
            likeCount: 4,
            isLiked: false,
          },
        ],
      },
      {
        id: "comment-202",
        author: yusuf,
        timeLabel: "20 menit lalu",
        content:
          "Foto yang ketiga itu kondisinya parah sekali. Harus segera ditangani sebelum ada korban.",
        likeCount: 9,
        isLiked: false,
        replies: [],
      },
    ],
  },
  {
    id: "post-3",
    author: ahmad,
    timeLabel: "3 jam lalu",
    content:
      "Program kebun komunitas Blok C berhasil panen perdana! Selada, kangkung, dan tomat cherry yang ditanam bersama warga sudah siap dipetik. Terima kasih untuk semua warga yang ikut berpartisipasi merawat kebun ini setiap minggunya. Hasil panen akan dibagikan rata ke semua keluarga yang terlibat 🌱",
    images: [
      unsplash("photo-1416879595882-3373a0480b5b", 600),
      unsplash("photo-1464226184884-fa280b87c399", 600),
      unsplash("photo-1592924357228-91a4daadcfea", 600),
      unsplash("photo-1530836369250-ef72a3f5cda8", 600),
      unsplash("photo-1579621970563-ebec7560ff3e", 600),
    ],
    likeCount: 90,
    isLiked: true,
    comments: [],
  },
  {
    id: "post-4",
    author: rina,
    timeLabel: "6 jam lalu",
    content:
      "Aspirasi: Mohon ada penertiban jam operasional alat berat proyek pembangunan Blok D. Suara bising mulai terdengar dari pukul 05.30 pagi dan mengganggu istirahat warga, terutama lansia dan anak-anak. Apakah bisa dimulai tidak sebelum pukul 07.00?",
    images: [
      unsplash("photo-1504307651254-35680f356dfd"),
      unsplash("photo-1541888946425-d81bb19240f5"),
    ],
    likeCount: 67,
    isLiked: false,
    comments: [],
  },
  {
    id: "post-5",
    author: yusuf,
    timeLabel: "1 hari lalu",
    content:
      "Update renovasi Mushola Al-Hidayah: Lantai baru sudah terpasang, pengecatan dinding hampir selesai, dan AC baru sudah diinstalasi. Tinggal pekerjaan finishing dan pemasangan karpet. Terima kasih atas dukungan crowdfunding dari seluruh warga! Estimasi selesai 3 hari lagi.",
    images: [
      unsplash("photo-1585320806297-9794b3e4eeae", 600),
      unsplash("photo-1564013799919-ab600027ffc6", 600),
      unsplash("photo-1556909114-f6e7ad7d3136", 600),
      unsplash("photo-1555041469-a586c61ea9bc", 600),
    ],
    likeCount: 53,
    isLiked: false,
    comments: [],
  },
];
