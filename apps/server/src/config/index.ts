import dotenv from 'dotenv';

dotenv.config();

export const config = {
	port: parseInt(process.env.PORT || '3001', 10),
	nodeEnv: process.env.NODE_ENV || 'development',

	database: {
		url: process.env.DATABASE_URL || 'postgresql://spot:spot_password@localhost:5433/spot_db'
	},

	jwt: {
		secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
		expiresIn: '7d'
	},

	cloudinary: {
		cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
		apiKey: process.env.CLOUDINARY_API_KEY || '',
		apiSecret: process.env.CLOUDINARY_API_SECRET || ''
	},

	cors: {
		frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
	},

	cas: {
		baseUrl: 'https://fed.princeton.edu/cas',
		serviceUrl: process.env.CAS_SERVICE_URL || 'http://localhost:3001/api/auth/callback'
	}
} as const;
