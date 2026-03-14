import { PrismaClient } from '@prisma/client';
import { hashPassword } from "better-auth/crypto";
import { auth } from '../src/lib/auth'
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@chathub.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminName = 'System Admin';

    console.log(`🚀 Iniciando creación de administrador: ${adminEmail}`);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (existingUser) {
        console.log('⚠️ El usuario ya existe. Actualizando a rol ADMIN...');
        await prisma.user.update({
            where: { email: adminEmail },
            data: { role: 'ADMIN' }
        });
        console.log('✅ Rol actualizado correctamente.');
        return;
    }

    const hashedPassword = await hashPassword(adminPassword);
    const userId = crypto.randomUUID();

    // Create User and Account (for better-auth)
    await auth.api.signUpEmail({
        body: {
            name: adminName,
            email: adminEmail,
            password: adminPassword
        }
    })

    console.log('✅ Administrador creado exitosamente con cuenta de email.');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
}

main()
    .catch((e) => {
        console.error('❌ Error al crear admin:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
