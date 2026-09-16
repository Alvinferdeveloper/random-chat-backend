import prisma from '../lib/prisma';
import logger from '../lib/logger';

export type AuditAction =
    | 'ROOM_STATUS_CHANGED'
    | 'ROOM_CATEGORIES_UPDATED'
    | 'USER_BANNED'
    | 'USER_UNBANNED'
    | 'USER_ROLE_CHANGED'
    | 'REPORT_RESOLVED'
    | 'REPORT_DISMISSED'
    | 'SETTING_UPDATED'
    | 'BROADCAST_SENT';

export type AuditTargetType = 'ROOM' | 'USER' | 'REPORT' | 'SETTING' | 'SYSTEM';

/**
 * Records an admin action in the audit log. Fire-and-forget from the
 * caller's perspective: failures are logged but never block the action
 * that triggered them.
 */
type AuditLogEntry = {
    adminId: string;
    action: AuditAction;
    targetType: AuditTargetType;
    targetId?: string;
    metadata?: Record<string, unknown>;
};

export const record = async (entry: AuditLogEntry) => {
    return prisma.adminAuditLog.create({
        data: {
            adminId: entry.adminId,
            action: entry.action,
            targetType: entry.targetType,
            targetId: entry.targetId,
            metadata: entry.metadata as any,
        },
    });
};

/**
 * Records an admin action without letting a logging failure block the
 * response for the action that triggered it. Use this from controllers
 * instead of calling `record` directly.
 */
export const logAction = (entry: AuditLogEntry) => {
    record(entry).catch((error) => {
        logger.error('Failed to record admin audit log entry', { error: (error as Error).message, entry });
    });
};

/**
 * Retrieves a paginated, optionally filtered list of audit log entries,
 * most recent first.
 */
export const findAll = async (page: number, limit: number, filters: { action?: string; targetType?: string } = {}) => {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (filters.action) where.action = filters.action;
    if (filters.targetType) where.targetType = filters.targetType;

    const [logs, total] = await prisma.$transaction([
        prisma.adminAuditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                admin: {
                    select: { name: true, username: true }
                }
            }
        }),
        prisma.adminAuditLog.count({ where })
    ]);

    return {
        data: logs,
        meta: {
            page,
            totalPages: Math.ceil(total / limit),
            total,
        }
    };
};
