import { betterAuth } from "better-auth";
import { customSession } from 'better-auth/plugins'
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { sendVerificationEmail } from '../services/email.service';
import logger from './logger';

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mysql",
    }),

    cookiePrefix: 'random-chat',

    advanced: {
        cookiePrefix: 'random-chat',
    },

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
            logger.debug('Verification URL generated', { email: user.email });
            await sendVerificationEmail(user.email, url);
        },
    },
    socialProviders: {
        google: {
            prompt: "select_account",
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
        facebook: {
            prompt: "select_account",
            clientId: process.env.FACEBOOK_CLIENT_ID as string,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
        },
    },
    plugins: [
        customSession(async ({ user, session }) => {
            const userDoc = await prisma.user.findFirst({ where: { id: session.userId }, select: { username: true, role: true } });
            return {
                user: {
                    ...user,
                    isCompleteProfile: !!userDoc?.username,
                    username: userDoc?.username,
                    role: userDoc?.role
                },
                session
            }
        })
    ],
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    const { isFeatureEnabled, SETTING_KEYS } = await import('../services/setting.service');
                    const registrationEnabled = await isFeatureEnabled(SETTING_KEYS.REGISTRATION_ENABLED);
                    if (!registrationEnabled) {
                        const { ERROR_MESSAGES } = await import('./errorMessages');
                        throw new Error(ERROR_MESSAGES.REGISTRATION_DISABLED);
                    }
                    return { data: user };
                }
            }
        }
    },
    trustedOrigins: JSON.parse(process.env.ALLOWED_ORIGINS || '[]'),
});

