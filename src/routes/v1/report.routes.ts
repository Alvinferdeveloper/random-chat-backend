import { Router } from 'express';
import {
    createReport,
    getTopOffenders,
    getReportsByUser,
    resolveUserReports,
    resolveReport
} from '../../controllers/report.controller';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middlewares/validate';
import {
    createReportSchema,
    getTopOffendersSchema,
    resolveReportsSchema,
    resolveReportSchema
} from '../../validations/report.validation';
import validateSession from '../../middlewares/validateSession';
import validateAdmin from '../../middlewares/validateAdmin';

const router = Router();

// User routes (any logged user)
router.post('/', validateSession, validate(createReportSchema), asyncHandler(createReport));

// Admin routes
router.get('/admin/top-offenders', validateSession, validateAdmin, validate(getTopOffendersSchema), asyncHandler(getTopOffenders));
router.get('/admin/user/:userId', validateSession, validateAdmin, asyncHandler(getReportsByUser));
router.patch('/admin/user/:userId/resolve', validateSession, validateAdmin, validate(resolveReportsSchema), asyncHandler(resolveUserReports));
router.patch('/admin/:reportId/resolve', validateSession, validateAdmin, validate(resolveReportSchema), asyncHandler(resolveReport));

export default router;
