export const ERROR_MESSAGES = {
    // Auth
    UNAUTHORIZED: 'User not authenticated',
    INVALID_SESSION: 'Invalid session',
    FORBIDDEN: 'Access denied',
    SESSION_EXPIRED: 'Session expired',

    // Users
    USER_NOT_FOUND: 'User not found',
    USERNAME_TAKEN: 'Username already taken',
    EMAIL_TAKEN: 'Email already in use',
    INVALID_HOBBIES: 'One or more selected hobbies are invalid',

    // Rooms
    ROOM_NOT_FOUND: 'Room not found',
    ROOM_NAME_TAKEN: 'Room name already taken',
    ROOM_NAME_TOO_SHORT: 'Room name must be at least 3 characters',
    ROOM_NAME_TOO_LONG: 'Room name must be less than 45 characters',
    NOT_ROOM_OWNER: 'You are not the owner of this room',
    ROOM_ALREADY_REJECTED: 'Room has already been rejected',
    ROOM_ALREADY_ACCEPTED: 'Room has already been accepted',
    ROOM_ALREADY_EXISTS: 'A room with a very similar name already exists',
    DAILY_LIMIT_REACHED: 'Daily limit reached',
    INVALID_CATEGORIES: 'One or more selected categories are invalid',

    // Validation
    INVALID_INPUT: 'Invalid input provided',
    FIELD_NOT_ALLOWED: 'Field not allowed for update',
    INVALID_URL: 'Invalid URL provided',
    INVALID_EMAIL: 'Invalid email format',
    INVALID_UUID: 'Invalid ID format',
    MISSING_FIELDS: 'Missing required fields',

    // Pagination
    INVALID_PAGE: 'Page must be a positive number',
    INVALID_LIMIT: 'Limit must be between 1 and 100',

    // Storage
    STORAGE_UNAVAILABLE: 'Storage service temporarily unavailable',
    UPLOAD_FAILED: 'File upload failed',
    IMAGE_UPLOAD_FAILED: 'Image upload failed',
    AUDIO_UPLOAD_FAILED: 'Audio upload failed',

    // Database
    DB_ERROR: 'An unexpected error occurred, please try again later',
    DB_UNAVAILABLE: 'Database service temporarily unavailable',

    // General
    INTERNAL_ERROR: 'An unexpected error occurred, please try again later',
    NOT_FOUND: 'Resource not found',
    ALREADY_EXISTS: 'Resource already exists',

    // Global Settings / Maintenance
    MAINTENANCE_MODE: 'Site is undergoing maintenance. Please try again later',
    REGISTRATION_DISABLED: 'User registration is currently disabled by the administrator',
    CHAT_DISABLED: 'Chat is temporarily disabled',
    ROOM_CREATION_DISABLED: 'Room creation is temporarily disabled',
} as const;

export type ErrorKey = keyof typeof ERROR_MESSAGES;