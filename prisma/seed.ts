import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({adapter});

async function main() {
    console.log("seeding");
    const villages = [
        { name: 'Cibeusi' },
        { name: 'Cikeruh' },
        { name: 'Cilayung' },
        { name: 'Cileles' },
        { name: 'Cipacing' },
        { name: 'Cisempur' },
        { name: 'Hegarmanah' },
        { name: 'Jatimukti' },
        { name: 'Jatiroke' },
        { name: 'Sayang' },
        { name: 'Sukawening' },
        { name: 'Cintamulya' },
    ]

    await prisma.village.createMany({
        data: villages,
        skipDuplicates:true
    })

    console.log("sedding berhasil");
}

main().catch((e) => {
    console.error(e);
    process.exit(1)
}).finally(async () => {
    await prisma.$disconnect();
})