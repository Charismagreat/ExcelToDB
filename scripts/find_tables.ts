import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const reports = await prisma.report.findMany({
        where: { OR: [{ displayName: { contains: '홈택스' } }, { displayName: { contains: '계산서' } }, { displayName: { contains: '어음' } }] }
    });
    console.log(JSON.stringify(reports, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
