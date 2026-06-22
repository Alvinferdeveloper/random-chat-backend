import prisma from '../lib/prisma';
import { ReportReason, ReportStatus } from '@prisma/client';
import { ChatMessage } from '../services/chat/adapters/base.adapter';

/**
 * Creates a new report.
 */
export const create = async (data: {
    reporterId: string;
    reportedUserId: string;
    roomId?: string;
    reason: ReportReason;
    details?: string;
    chatContext?: ChatMessage[];
}) => {
    return prisma.report.create({
        data: {
            ...data,
            chatContext: data.chatContext as any
        },
        include: {
            reportedUser: {
                select: { username: true }
            }
        }
    });
};

/**
 * Counts pending reports.
 */
export const countPending = async () => {
    return prisma.report.count({
        where: { status: 'PENDING' }
    });
};

/**
 * Retrieves pending reports grouped by reported user to highlight top offenders.
 */
export const getTopOffenders = async (page: number, limit: number) => {
    const skip = (page - 1) * limit;

    // Group by reportedUserId and count PENDING reports
    const groupedReports = await prisma.report.groupBy({
        by: ['reportedUserId'],
        where: { status: 'PENDING' },
        _count: {
            _all: true
        },
        orderBy: {
            _count: {
                reportedUserId: 'desc'
            }
        },
        skip,
        take: limit
    });

    // Fetch user details for the top offenders
    const offenders = await Promise.all(groupedReports.map(async (group) => {
        const user = await prisma.user.findUnique({
            where: { id: group.reportedUserId },
            select: {
                id: true,
                username: true,
                email: true,
                image: true,
                isBanned: true
            }
        });

        // Get recent report reasons for this user
        const recentReports = await prisma.report.findMany({
            where: { reportedUserId: group.reportedUserId, status: 'PENDING' },
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: { reason: true, createdAt: true }
        });

        return {
            user,
            reportCount: group._count._all,
            recentReasons: recentReports.map(r => r.reason),
            lastReportedAt: recentReports[0]?.createdAt
        };
    }));

    const totalOffenders = await prisma.report.groupBy({
        by: ['reportedUserId'],
        where: { status: 'PENDING' }
    });

    return {
        offenders,
        pagination: {
            total: totalOffenders.length,
            page,
            limit,
            totalPages: Math.ceil(totalOffenders.length / limit)
        }
    };
};

/**
 * Retrieves all reports for a specific user.
 */
export const findByReportedUser = async (reportedUserId: string) => {
    return prisma.report.findMany({
        where: { reportedUserId },
        orderBy: { createdAt: 'desc' },
        include: {
            reporter: {
                select: { username: true }
            },
            room: {
                select: { name: true }
            }
        }
    });
};

/**
 * Updates report status (RESOLVED, DISMISSED).
 */
export const updateStatusByReportedUser = async (reportedUserId: string, status: ReportStatus) => {
    return prisma.report.updateMany({
        where: { reportedUserId, status: 'PENDING' },
        data: { status }
    });
};

/**
 * Retrieves reports made by a specific user (as reporter).
 */
export const findByReporter = async (reporterId: string) => {
    return prisma.report.findMany({
        where: { reporterId },
        orderBy: { createdAt: 'desc' },
        include: {
            reportedUser: {
                select: { username: true }
            },
            room: {
                select: { name: true }
            }
        }
    });
};
