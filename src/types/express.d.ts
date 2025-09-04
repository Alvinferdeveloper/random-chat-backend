// Type augmentation for Express to support req.user and req.session
// Place under src/types so tsconfig picks it up automatically

export {};

declare global {
  namespace Express {
    interface AuthUser {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      isCompleteProfile?: boolean;
      // add any other fields your auth exposes
      [key: string]: unknown;
    }

    interface AuthSession {
      userId: string;
      // add any extra fields you use from the session
      [key: string]: unknown;
    }

    interface Request {
      user?: AuthUser;
      session?: AuthSession;
    }
  }
}
