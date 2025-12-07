import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
	if (!req.user) {
		res.status(401).json({ error: 'Authentication required' });
		return;
	}

	if (!req.user.isAdmin) {
		res.status(403).json({ error: 'Admin privileges required' });
		return;
	}

	next();
}
