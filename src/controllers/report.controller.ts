import { Request, Response } from 'express';
import * as ReportRepository from '../repositories/report.repository';
import * as AuditLogRepository from '../repositories/audit-log.repository';
import ApiError from '../utils/ApiError';

/**
 * Creates a new report.
 */
export const createReport = async (req: Request, res: Response) => {
    const { reportedUserId, roomId, reason, details } = req.body;
    const reporterId = req.user!.id;

    if (reporterId === reportedUserId) {
        throw new ApiError(400, "No puedes reportarte a ti mismo.");
    }

    const report = await ReportRepository.create({
        reporterId,
        reportedUserId,
        roomId,
        reason,
        details
    });

    res.status(201).json({
        success: true,
        message: "Reporte enviado correctamente. Gracias por ayudar a mantener la comunidad segura.",
        data: report
    });
};

/**
 * Retrieves top offenders for admin.
 */
export const getTopOffenders = async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;

    const data = await ReportRepository.getTopOffenders(page, limit, search);
    res.status(200).json(data);
};

/**
 * Retrieves full report history for a specific user for admin.
 */
export const getReportsByUser = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const data = await ReportRepository.findByReportedUser(userId);
    res.status(200).json(data);
};

/**
 * Resolves or dismisses all pending reports for a user.
 */
export const resolveUserReports = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { status } = req.body;

    await ReportRepository.updateStatusByReportedUser(userId, status);

    AuditLogRepository.logAction({
        adminId: req.user!.id,
        action: status === 'RESOLVED' ? 'REPORT_RESOLVED' : 'REPORT_DISMISSED',
        targetType: 'USER',
        targetId: userId,
    });

    res.status(200).json({
        success: true,
        message: `Reportes marcados como ${status.toLowerCase()} correctamente.`
    });
};

/**
 * Resolves or dismisses a single report, leaving the reported user's
 * other pending reports untouched.
 */
export const resolveReport = async (req: Request, res: Response) => {
    const { reportId } = req.params;
    const { status } = req.body;

    const updated = await ReportRepository.updateStatusById(reportId, status);

    AuditLogRepository.logAction({
        adminId: req.user!.id,
        action: status === 'RESOLVED' ? 'REPORT_RESOLVED' : 'REPORT_DISMISSED',
        targetType: 'REPORT',
        targetId: reportId,
        metadata: { reportedUserId: updated.reportedUserId },
    });

    res.status(200).json({
        success: true,
        message: `Reporte marcado como ${status.toLowerCase()} correctamente.`,
        data: updated,
    });
};
