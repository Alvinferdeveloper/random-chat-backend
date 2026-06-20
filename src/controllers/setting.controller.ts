import { Request, Response } from 'express';
import * as SettingService from '../services/setting.service';
import ApiError from '../utils/ApiError';

/**
 * GET /api/v1/settings
 * Public endpoint: returns all public-facing feature flags.
 */
export const getPublicSettings = async (_req: Request, res: Response) => {
    const settings = await SettingService.getPublicSettings();
    res.status(200).json({ settings });
};

/**
 * GET /api/v1/admin/settings
 * Admin only: returns ALL settings including internal ones.
 */
export const getAllSettings = async (_req: Request, res: Response) => {
    const settings = await SettingService.getSettingsDetails();
    res.status(200).json({ settings });
};

/**
 * PATCH /api/v1/admin/settings/:key
 * Admin only: updates a single setting by key.
 */
export const updateSetting = async (req: Request, res: Response) => {
    const { key } = req.params;
    const { value, description } = req.body;

    const updated = await SettingService.updateSetting(key, value, description);

    res.status(200).json({
        success: true,
        message: `Configuración '${key}' actualizada correctamente.`,
        data: updated,
    });
};
