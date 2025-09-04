import { betterAuth } from "better-auth";
import { customSession } from 'better-auth/plugins'
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mysql",
    }),
    socialProviders: {
        google: {
            prompt: "select_account",
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    plugins: [
        customSession(async ({ user, session }) => {
            const userDoc = await prisma.user.findFirst({ where: { id: session.userId } });
            return {
                user: {
                    ...user,
                    isCompleteProfile: !!userDoc?.name
                },
                session
            }
        })
    ],
    trustedOrigins: ["http://localhost:3000"],
});
