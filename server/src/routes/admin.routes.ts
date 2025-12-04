import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import multer from 'multer';

const router = Router();
const adminController = new AdminController();

// Configure multer for image uploads (memory storage for processing before Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
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

// Daily challenge management
router.post('/daily/set', adminController.setDailyChallenge);

export default router;
