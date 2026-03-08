import { PrismaClient } from ;

const prisma = new PrismaClient();

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

    await prisma

}