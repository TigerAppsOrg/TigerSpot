import { Router, type Router as RouterType } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import multer from 'multer';

const router: RouterType = Router();
const adminController = new AdminController();

// Configure multer for image uploads (memory storage for processing before Cloudinary)
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024 // 10MB limit
	},
	fileFilter: (_req, file, cb) => {
		// Accept image/* MIME types and HEIC/HEIF by extension (browsers may not set correct MIME)
		const isImage = file.mimetype.startsWith('image/');
		const isHeic =
			file.originalname.toLowerCase().endsWith('.heic') ||
			file.originalname.toLowerCase().endsWith('.heif');
		if (isImage || isHeic) {
			cb(null, true);
		} else {
			cb(new Error('Only image files are allowed'));
		}
	}
});

// All admin routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Image management
router.get('/images', adminController.listImages);
router.post('/images/preview', upload.single('image'), adminController.processImagePreview);
router.post('/images/upload', upload.single('image'), adminController.uploadImage);
router.put('/images/:id', adminController.updateImage);
router.delete('/images/:id', adminController.deleteImage);

// User management
router.get('/users', adminController.listUsers);
router.patch('/users/:username', adminController.updateUser);

// Tournament management
router.post('/tournament', adminController.createTournament);
router.post('/tournament/:id/start', adminController.startTournament);
router.post('/tournament/:id/cancel', adminController.cancelTournament);
router.delete('/tournament/:id', adminController.deleteTournament);

// Dev-only tournament testing (guarded by NODE_ENV in controller)
router.post('/tournament/:id/test-players', adminController.addTestPlayers);
router.post('/tournament/:id/match/:matchId/simulate', adminController.simulateMatchWinner);

// Daily challenge management
router.post('/daily/set', adminController.setDailyChallenge);

export default router;
