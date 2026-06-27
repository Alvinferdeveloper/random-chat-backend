import { Request, Response } from 'express';
import * as ReportRepository from '../repositories/report.repository';
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
    
    res.status(200).json({
        success: true,
        message: `Reportes marcados como ${status.toLowerCase()} correctamente.`
    });
};
