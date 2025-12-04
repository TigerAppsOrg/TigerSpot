import exifr from 'exifr';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';
import type { Difficulty } from '@prisma/client';

// Configure Cloudinary
cloudinary.config({
	cloud_name: config.cloudinary.cloudName,
	api_key: config.cloudinary.apiKey,
	api_secret: config.cloudinary.apiSecret
});

interface ExifGpsData {
	latitude: number | null;
	longitude: number | null;
	dateTaken: Date | null;
}

interface UploadResult {
	publicId: string;
	url: string;
}

export class ImageService {
	/**
	 * Extract GPS coordinates from image EXIF data
	 * Supports JPEG, PNG, HEIC/HEIF, and other formats
	 */
	async extractExifData(buffer: Buffer): Promise<ExifGpsData> {
		try {
			// First try to get GPS data directly (works for most formats including HEIC)
			const gps = await exifr.gps(buffer);

			if (gps && gps.latitude !== undefined && gps.longitude !== undefined) {
				// Get additional metadata
				const exif = await exifr.parse(buffer, {
					pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate']
				});

				return {
					latitude: gps.latitude,
					longitude: gps.longitude,
					dateTaken: exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.ModifyDate ?? null
				};
			}

			// Fallback: try full parse with all segments enabled (for edge cases)
			const fullExif = await exifr.parse(buffer, {
				gps: true,
				tiff: true,
				xmp: true,
				icc: false,
				iptc: false,
				jfif: false,
				ihdr: false
			});

			if (fullExif) {
				return {
					latitude: fullExif.latitude ?? null,
					longitude: fullExif.longitude ?? null,
					dateTaken: fullExif.DateTimeOriginal ?? fullExif.CreateDate ?? null
				};
			}

			return { latitude: null, longitude: null, dateTaken: null };
		} catch (error) {
			console.error('EXIF extraction error:', error);
			return { latitude: null, longitude: null, dateTaken: null };
		}
	}

	/**
	 * Upload image buffer to Cloudinary
	 */
	async uploadToCloudinary(buffer: Buffer, filename: string): Promise<UploadResult> {
		return new Promise((resolve, reject) => {
			const uploadStream = cloudinary.uploader.upload_stream(
				{
					folder: 'tigerspot',
					resource_type: 'image',
					public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}`,
					transformation: [{ width: 1920, height: 1080, crop: 'limit' }, { quality: 'auto:good' }]
				},
				(error, result) => {
					if (error || !result) {
						reject(error || new Error('Upload failed'));
					} else {
						resolve({
							publicId: result.public_id,
							url: result.secure_url
						});
					}
				}
			);

			// Convert buffer to readable stream and pipe to Cloudinary
			const readableStream = new Readable();
			readableStream.push(buffer);
			readableStream.push(null);
			readableStream.pipe(uploadStream);
		});
	}

	/**
	 * Delete image from Cloudinary
	 */
	async deleteFromCloudinary(publicId: string): Promise<void> {
		await cloudinary.uploader.destroy(publicId);
	}

	/**
	 * Create picture record in database
	 */
	async createPicture(data: {
		cloudinaryId: string;
		imageUrl: string;
		latitude: number;
		longitude: number;
		placeName: string;
		difficulty: Difficulty;
		uploadedBy: string;
	}) {
		return prisma.picture.create({
			data
		});
	}

	/**
	 * Update picture record
	 */
	async updatePicture(
		id: number,
		data: {
			latitude?: number;
			longitude?: number;
			placeName?: string;
			difficulty?: Difficulty;
		}
	) {
		return prisma.picture.update({
			where: { id },
			data
		});
	}

	/**
	 * Delete picture (removes from Cloudinary and database)
	 */
	async deletePicture(id: number) {
		const picture = await prisma.picture.findUnique({ where: { id } });
		if (!picture) {
			throw new Error('Picture not found');
		}

		// Delete from Cloudinary
		await this.deleteFromCloudinary(picture.cloudinaryId);

		// Delete from database
		await prisma.picture.delete({ where: { id } });
	}

	/**
	 * List all pictures
	 */
	async listPictures() {
		return prisma.picture.findMany({
			orderBy: { createdAt: 'desc' },
			include: {
				uploader: {
					select: { displayName: true }
				}
			}
		});
	}

	/**
	 * Get random pictures by difficulty
	 */
	async getRandomPictures(count: number, difficulty?: Difficulty) {
		const where = difficulty ? { difficulty } : {};

		const pictures = await prisma.picture.findMany({
			where,
			select: {
				id: true,
				imageUrl: true,
				latitude: true,
				longitude: true,
				placeName: true,
				difficulty: true
			}
		});

		// Shuffle and take requested count
		const shuffled = pictures.sort(() => Math.random() - 0.5);
		return shuffled.slice(0, count);
	}
}
