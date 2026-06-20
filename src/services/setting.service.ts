import * as SettingRepository from '../repositories/setting.repository';
import { cacheService } from '../lib/cache';

const SETTINGS_CACHE_KEY = 'global_settings';
const SETTINGS_CACHE_TTL_MS = 60_000; // 1 minute

/**
 * Known setting keys for type safety across the app.
 */
export const SETTING_KEYS = {
    ROOM_CREATION_ENABLED: 'room_creation_enabled',
    REGISTRATION_ENABLED: 'registration_enabled',
    MAINTENANCE_MODE: 'maintenance_mode',
    CHAT_ENABLED: 'chat_enabled',
} as const;

export type SettingKey = typeof SETTING_KEYS[keyof typeof SETTING_KEYS];

/**
 * Returns all settings as a key-value record, using cache.
 */
export const getAllSettings = async (): Promise<Record<string, string>> => {
    const cached = await cacheService.get<Record<string, string>>(SETTINGS_CACHE_KEY);
    if (cached) return cached;

    const settings = await SettingRepository.getAllSettings();
    const record = Object.fromEntries(settings.map(s => [s.key, s.value]));

    await cacheService.set(SETTINGS_CACHE_KEY, record, SETTINGS_CACHE_TTL_MS);
    return record;
};

/**
 * Returns all settings with full details (key, value, description, updatedAt).
 */
export const getSettingsDetails = async () => {
    return await SettingRepository.getAllSettings();
};

/**
 * Returns the public-facing settings (safe to expose to the frontend).
 * All keys in SETTING_KEYS are considered public.
 */
export const getPublicSettings = async (): Promise<Record<string, string>> => {
    const all = await getAllSettings();
    const publicKeys = Object.values(SETTING_KEYS) as string[];
    return Object.fromEntries(
        Object.entries(all).filter(([key]) => publicKeys.includes(key))
    );
};

/**
 * Checks if a boolean flag setting is enabled.
 * Defaults to `true` if the setting does not exist.
 */
export const isFeatureEnabled = async (key: SettingKey, defaultValue = true): Promise<boolean> => {
    const settings = await getAllSettings();
    if (!(key in settings)) return defaultValue;
    return settings[key] === 'true';
};

/**
 * Updates a setting and invalidates the cache.
 */
export const updateSetting = async (key: string, value: string, description?: string) => {
    const result = await SettingRepository.updateSetting(key, value, description);
    await cacheService.invalidate(SETTINGS_CACHE_KEY);
    return result;
};
