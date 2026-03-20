import "dotenv/config";
import { Role } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

const agencies = [
  { email: "agency.pupr@nangorlens.id", agencyName: "Dinas PUPR Kabupaten" },
  {
    email: "agency.lingkungan@nangorlens.id",
    agencyName: "Dinas Lingkungan Hidup",
  },
  {
    email: "agency.perhubungan@nangorlens.id",
    agencyName: "Dinas Perhubungan",
  },
];

const citizens = [
  {
    email: "andi.warga@mail.com",
    fullName: "Andi Pratama",
    address: "Jl. Melati No. 10, Jatinangor",
    isVerified: true,
  },
  {
    email: "budi.warga@mail.com",
    fullName: "Budi Santoso",
    address: "Jl. Cendana No. 8, Jatinangor",
    isVerified: false,
  },
  {
    email: "citra.warga@mail.com",
    fullName: "Citra Lestari",
    address: "Jl. Anggrek No. 21, Jatinangor",
    isVerified: true,
  },
  {
    email: "dewi.warga@mail.com",
    fullName: "Dewi Maharani",
    address: "Jl. Kenanga No. 5, Jatinangor",
    isVerified: false,
  },
];

async function seedAgencies() {
  for (const item of agencies) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: { role: Role.AGENCY },
      create: { email: item.email, role: Role.AGENCY },
    });

    await prisma.agencyProfile.upsert({
      where: { userId: user.id },
      update: { agencyName: item.agencyName },
      create: { userId: user.id, agencyName: item.agencyName },
    });
  }
}

async function seedCitizens() {
  for (const item of citizens) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: { role: Role.CITIZEN },
      create: { email: item.email, role: Role.CITIZEN },
    });

    await prisma.citizenProfile.upsert({
      where: { userId: user.id },
      update: {
        fullName: item.fullName,
        address: item.address,
        isVerified: item.isVerified,
      },
      create: {
        userId: user.id,
        fullName: item.fullName,
        address: item.address,
        isVerified: item.isVerified,
      },
    });
  }
}

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany();
    await tx.donation.deleteMany();
    await tx.vote.deleteMany();
    await tx.comment.deleteMany();
    await tx.projectUpdate.deleteMany();
    await tx.announcement.deleteMany();
    await tx.project.deleteMany();
    await tx.agencyProfile.deleteMany();
    await tx.citizenProfile.deleteMany();
    await tx.user.deleteMany();
  });

  await seedAgencies();
  await seedCitizens();

  const userCount = await prisma.user.count();
  const agencyCount = await prisma.agencyProfile.count();
  const citizenCount = await prisma.citizenProfile.count();

  console.log("Seed complete");
  console.log({ userCount, agencyCount, citizenCount });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
