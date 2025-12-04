import { createServer } from 'http';
import app from './app.js';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initializeSocket } from './socket/index.js';

const server = createServer(app);

// Initialize Socket.io
initializeSocket(server);

async function start() {
	try {
		// Connect to database
		await connectDatabase();

		// Start HTTP server
		server.listen(config.port, () => {
			console.log(`Server running on http://localhost:${config.port}`);
			console.log(`Environment: ${config.nodeEnv}`);
		});
	} catch (error) {
		console.error('Failed to start server:', error);
		process.exit(1);
	}
}

// Graceful shutdown
process.on('SIGTERM', async () => {
	console.log('SIGTERM received, shutting down gracefully');
	server.close();
	await disconnectDatabase();
	process.exit(0);
});

process.on('SIGINT', async () => {
	console.log('SIGINT received, shutting down gracefully');
	server.close();
	await disconnectDatabase();
	process.exit(0);
});

start();
