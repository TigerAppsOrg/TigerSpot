import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
	log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

export async function connectDatabase() {
	try {
		await prisma.$connect();
		console.log('Connected to PostgreSQL database');
	} catch (error) {
		console.error('Failed to connect to database:', error);
		process.exit(1);
	}
}

export async function disconnectDatabase() {
	await prisma.$disconnect();
	console.log('Disconnected from database');
}
