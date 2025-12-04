import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import gameRoutes from './routes/game.routes.js';
import versusRoutes from './routes/versus.routes.js';
import tournamentRoutes from './routes/tournament.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
	cors({
		origin: config.cors.frontendUrl,
		credentials: true
	})
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/versus', versusRoutes);
app.use('/api/tournament', tournamentRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((_req, res) => {
	res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	console.error('Unhandled error:', err);
	res.status(500).json({
		error: config.nodeEnv === 'development' ? err.message : 'Internal server error'
	});
});

export default app;
