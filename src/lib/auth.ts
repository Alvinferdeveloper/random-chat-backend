import { betterAuth } from "better-auth";
import { customSession } from 'better-auth/plugins'
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mysql",
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }) => {
            console.log("--- EMAIL DE VERIFICACIÓN ---");
            console.log(`Para: ${user.email}`);
            console.log(`URL de Verificación: ${url}`);
            console.log("---------------------------");
        },
    },
    socialProviders: {
        google: {
            prompt: "select_account",
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    plugins: [
        customSession(async ({ user, session }) => {
            const userDoc = await prisma.user.findFirst({ where: { id: session.userId }, select: { username: true } });
            return {
                user: {
                    ...user,
                    isCompleteProfile: !!userDoc?.username
                },
                session
            }
        })
    ],
    trustedOrigins: ["http://localhost:3000"],
});
