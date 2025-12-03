import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserRole() {
    try {
        const user = await prisma.user.update({
            where: { email: 'dummy@gmail.com' },
            data: { role: 'OWNER' }
        });
        console.log('User role updated:', user);
    } catch (error) {
        console.error('Error updating user role:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateUserRole();
