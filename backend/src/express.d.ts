// backend/src/types/express.d.ts
// ─── Required for req.user to be typed throughout the backend ────────────────
// Place this file at: backend/src/types/express.d.ts
// Ensure backend tsconfig.json includes: "include": ["src/**/*", "src/types/**/*"]

import type { User } from '../../../shared/types/user';

declare global {
  namespace Express {
    interface Request {
      user?: Pick<User,
        | 'id'
        | 'email'
        | 'name'
        | 'plan'
        | 'is_admin'
        | 'is_banned'
        | 'points'
        | 'selected_language'
        | 'streak_current'
        | 'ai_queries_today'
      >;
    }
  }
}

export {};
