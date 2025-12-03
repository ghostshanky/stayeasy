import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserRole() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'dummy@gmail.com' }
        });
        console.log('User:', user);
    } catch (error) {
        console.error('Error fetching user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUserRole();
