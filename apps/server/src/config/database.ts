import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// Ensure URL uses postgresql:// scheme (adapter-pg requirement)
const databaseUrl = process.env.DATABASE_URL?.replace(/^postgres:\/\//, 'postgresql://');

const adapter = new PrismaPg({ connectionString: databaseUrl });

export const prisma = new PrismaClient({
	log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
	adapter
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
