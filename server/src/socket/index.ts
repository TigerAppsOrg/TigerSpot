import { Server as HTTPServer } from 'http';
import { Server } from 'socket.io';
import { config } from '../config/index.js';
import { setupVersusHandlers } from './handlers/versus.handler.js';
import { setupTournamentHandlers } from './handlers/tournament.handler.js';

let io: Server;

export function initializeSocket(httpServer: HTTPServer) {
	io = new Server(httpServer, {
		cors: {
			origin: (origin, callback) => {
				// Allow requests with no origin
				if (!origin) return callback(null, true);

				// In development, allow localhost and any local network IP on port 5173
				if (config.nodeEnv === 'development') {
					if (origin.includes(':5173') || origin === config.cors.frontendUrl) {
						return callback(null, true);
					}
				}

				// In production, only allow configured frontend URL
				if (origin === config.cors.frontendUrl) {
					return callback(null, true);
				}

				callback(new Error('Not allowed by CORS'));
			},
			credentials: true
		}
	});

	// Main namespace
	io.on('connection', (socket) => {
		console.log(`Client connected: ${socket.id}`);

		socket.on('disconnect', () => {
			console.log(`Client disconnected: ${socket.id}`);
		});
	});

	// Versus mode namespace
	const versusNamespace = io.of('/versus');
	versusNamespace.on('connection', (socket) => {
		console.log(`Versus client connected: ${socket.id}`);
		setupVersusHandlers(socket, versusNamespace);
	});

	// Tournament mode namespace
	const tournamentNamespace = io.of('/tournament');
	tournamentNamespace.on('connection', (socket) => {
		console.log(`Tournament client connected: ${socket.id}`);
		setupTournamentHandlers(socket, tournamentNamespace);
	});

	console.log('Socket.io initialized');
	return io;
}

export function getIO(): Server {
	if (!io) {
		throw new Error('Socket.io not initialized');
	}
	return io;
}
