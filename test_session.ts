import { PrismaClient } from '@prisma/client';
import { AuthService } from './server/auth';

const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Testing full login flow...');
        const email = 'dummy@gmail.com';
        const password = 'dummy';

        // 1. Ensure user exists
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log('Creating user...');
            user = await AuthService.createUser(email, password, 'Dummy User', 'TENANT');
        } else {
            console.log('User exists. Updating password to be sure...');
            const hashedPassword = await AuthService.hashPassword(password);
            await prisma.user.update({
                where: { email },
                data: { password: hashedPassword }
            });
        }

        // 2. Authenticate
        console.log('Authenticating...');
        const authUser = await AuthService.authenticateUser(email, password);
        if (!authUser) {
            throw new Error('Authentication failed');
        }
        console.log('Authenticated:', authUser.id);

        // 3. Create Session
        console.log('Creating session...');
        const session = await AuthService.createSession(authUser);
        console.log('Session created:', session);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
