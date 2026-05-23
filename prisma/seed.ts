import "dotenv/config";
import { ProjectStatus, Role } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

const DEFAULT_PASSWORD_HASH = "seed_placeholder_hash";

const agencies = [
  {
    email: "agency.pupr@nangorlens.id",
    agencyName: "Dinas PUPR Kabupaten",
    phone: "081200000001",
    address: "Komplek Pemda Jatinangor",
  },
  {
    email: "agency.lingkungan@nangorlens.id",
    agencyName: "Dinas Lingkungan Hidup",
    phone: "081200000002",
    address: "Jl. Raya Jatinangor No. 12",
  },
  {
    email: "agency.perhubungan@nangorlens.id",
    agencyName: "Dinas Perhubungan",
    phone: "081200000003",
    address: "Jl. Cikeruh No. 5",
  },
];

const citizens = [
  {
    email: "andi.warga@mail.com",
    fullName: "Andi Pratama",
    phone: "081300000001",
    kkNumber: "3204000100000001",
    nik: "3204000100000001",
    blockHouse: "Melati",
    houseNumber: "10",
    isVerified: true,
  },
  {
    email: "budi.warga@mail.com",
    fullName: "Budi Santoso",
    phone: "081300000002",
    kkNumber: "3204000100000002",
    nik: "3204000100000002",
    blockHouse: "Cendana",
    houseNumber: "8",
    isVerified: false,
  },
  {
    email: "citra.warga@mail.com",
    fullName: "Citra Lestari",
    phone: "081300000003",
    kkNumber: "3204000100000003",
    nik: "3204000100000003",
    blockHouse: "Anggrek",
    houseNumber: "21",
    isVerified: true,
  },
  {
    email: "dewi.warga@mail.com",
    fullName: "Dewi Maharani",
    phone: "081300000004",
    kkNumber: "3204000100000004",
    nik: "3204000100000004",
    blockHouse: "Kenanga",
    houseNumber: "5",
    isVerified: false,
  },
];

const projectCategories = ["Infrastruktur", "Lingkungan", "Transportasi"];

const projects = [
  {
    title: "Perbaikan Jalan Utama Cikeruh",
    description:
      "Perbaikan jalan utama sepanjang 2 km untuk mengurangi kerusakan dan kemacetan saat jam sibuk.",
    status: ProjectStatus.BERJALAN,
    budgetTarget: "850000000",
    currentFunding: "245000000",
    priorityScore: 87.5,
    estimatedDurationDays: 120,
    categoryName: "Infrastruktur",
    agencyEmail: "agency.pupr@nangorlens.id",
    latitude: -6.9302,
    longitude: 107.7734,
  },
  {
    title: "Normalisasi Saluran Drainase RW 04",
    description:
      "Pembersihan dan pelebaran saluran drainase untuk mencegah banjir genangan di musim hujan.",
    status: ProjectStatus.DISETUJUI,
    budgetTarget: "350000000",
    currentFunding: "120000000",
    priorityScore: 79.1,
    estimatedDurationDays: 75,
    categoryName: "Lingkungan",
    agencyEmail: "agency.lingkungan@nangorlens.id",
    latitude: -6.9284,
    longitude: 107.7709,
  },
  {
    title: "Penataan Marka dan Rambu Jalan Sekolah",
    description:
      "Penambahan marka penyeberangan, rambu peringatan, dan lampu kedip di sekitar kawasan sekolah.",
    status: ProjectStatus.USULAN,
    budgetTarget: "180000000",
    currentFunding: "25000000",
    priorityScore: 72.3,
    estimatedDurationDays: 45,
    categoryName: "Transportasi",
    agencyEmail: "agency.perhubungan@nangorlens.id",
    latitude: -6.9257,
    longitude: 107.776,
  },
];

async function seedAgencies() {
  for (const item of agencies) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: { role: Role.AGENCY, passwordHash: DEFAULT_PASSWORD_HASH },
      create: {
        email: item.email,
        role: Role.AGENCY,
        passwordHash: DEFAULT_PASSWORD_HASH,
      },
    });

    await prisma.agencyProfile.upsert({
      where: { userId: user.id },
      update: {
        agencyName: item.agencyName,
        phone: item.phone,
        address: item.address,
      },
      create: {
        userId: user.id,
        agencyName: item.agencyName,
        phone: item.phone,
        address: item.address,
      },
    });
  }
}

async function seedCitizens() {
  for (const item of citizens) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: { role: Role.WARGA, passwordHash: DEFAULT_PASSWORD_HASH },
      create: {
        email: item.email,
        role: Role.WARGA,
        passwordHash: DEFAULT_PASSWORD_HASH,
      },
    });

    await prisma.citizenProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: item.fullName,
        phone: item.phone,
        kkNumber: item.kkNumber,
        nik: item.nik,
        blockHouse: item.blockHouse,
        houseNumber: item.houseNumber,
        isVerified: item.isVerified,
      },
      create: {
        userId: user.id,
        fullName: item.fullName,
        phone: item.phone,
        kkNumber: item.kkNumber,
        nik: item.nik,
        blockHouse: item.blockHouse,
        houseNumber: item.houseNumber,
        isVerified: item.isVerified,
      },
    });
  }
}

async function seedProjects() {
  for (const categoryName of projectCategories) {
    const existingCategory = await prisma.projectCategory.findFirst({
      where: { name: categoryName },
      select: { id: true },
    });

    if (!existingCategory) {
      await prisma.projectCategory.create({
        data: { name: categoryName },
      });
    }
  }

  for (const item of projects) {
    const agencyUser = await prisma.user.findUnique({
      where: { email: item.agencyEmail },
      select: { id: true },
    });

    const category = await prisma.projectCategory.findFirst({
      where: { name: item.categoryName },
      select: { id: true },
    });

    if (!agencyUser || !category) {
      throw new Error(`Missing relation for project seed: ${item.title}`);
    }

    await prisma.project.create({
      data: {
        title: item.title,
        description: item.description,
        status: item.status,
        budgetTarget: item.budgetTarget,
        currentFunding: item.currentFunding,
        priorityScore: item.priorityScore,
        estimatedDurationDays: item.estimatedDurationDays,
        latitude: item.latitude,
        longitude: item.longitude,
        categoryId: category.id,
        agencyId: agencyUser.id,
      },
    });
  }
}

void seedAgencies;
void seedCitizens;
void seedProjects;

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany();
    await tx.donation.deleteMany();
    await tx.vote.deleteMany();
    await tx.comment.deleteMany();
    await tx.projectUpdate.deleteMany();
    await tx.news.deleteMany();
    await tx.project.deleteMany();
    await tx.projectCategory.deleteMany();
    await tx.agencyProfile.deleteMany();
    await tx.citizenProfile.deleteMany();
    await tx.user.deleteMany();
  });

  // await seedAgencies();
  // await seedCitizens();
  // await seedProjects();

  const userCount = await prisma.user.count();
  const agencyCount = await prisma.agencyProfile.count();
  const citizenCount = await prisma.citizenProfile.count();
  const categoryCount = await prisma.projectCategory.count();
  const projectCount = await prisma.project.count();

  console.log("Seed complete");
  console.log({
    userCount,
    agencyCount,
    citizenCount,
    categoryCount,
    projectCount,
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
