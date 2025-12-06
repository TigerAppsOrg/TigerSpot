import exifr from 'exifr';
import sharp from 'sharp';
import heicConvert from 'heic-convert';
import { exiftool } from 'exiftool-vendored';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
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
	 * Check if buffer is HEIC/HEIF format by checking magic bytes
	 */
	isHeic(buffer: Buffer): boolean {
		// HEIC/HEIF files have 'ftyp' at offset 4 and 'heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1' at offset 8
		if (buffer.length < 12) return false;
		const ftyp = buffer.toString('ascii', 4, 8);
		if (ftyp !== 'ftyp') return false;
		const brand = buffer.toString('ascii', 8, 12);
		return ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand);
	}

	/**
	 * Convert HEIC to JPEG buffer
	 */
	async convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
		const outputBuffer = await heicConvert({
			buffer: buffer,
			format: 'JPEG',
			quality: 0.85
		});
		return Buffer.from(outputBuffer);
	}

	/**
	 * Convert any image format to JPEG
	 * Handles HEIC separately, then uses sharp for other formats
	 */
	async convertToJpeg(buffer: Buffer): Promise<Buffer> {
		// Handle HEIC separately since sharp doesn't support it
		if (this.isHeic(buffer)) {
			return this.convertHeicToJpeg(buffer);
		}
		return sharp(buffer).jpeg({ quality: 85 }).toBuffer();
	}

	/**
	 * Process image to generate preview and extract GPS
	 * Returns base64 JPEG preview and GPS coordinates
	 */
	async processImagePreview(buffer: Buffer): Promise<{
		previewBase64: string;
		gpsCoords: { lat: number; lng: number } | null;
	}> {
		// Extract GPS from original buffer (before conversion)
		const exifData = await this.extractExifData(buffer);
		const gpsCoords =
			exifData.latitude !== null && exifData.longitude !== null
				? { lat: exifData.latitude, lng: exifData.longitude }
				: null;

		let previewBuffer: Buffer;

		// Handle HEIC separately since sharp doesn't support it
		if (this.isHeic(buffer)) {
			// Convert HEIC to JPEG first
			const jpegBuffer = await this.convertHeicToJpeg(buffer);
			// Then resize with sharp
			previewBuffer = await sharp(jpegBuffer)
				.resize(800, 600, { fit: 'inside', withoutEnlargement: true })
				.jpeg({ quality: 80 })
				.toBuffer();
		} else {
			// For other formats, sharp can handle directly
			previewBuffer = await sharp(buffer)
				.resize(800, 600, { fit: 'inside', withoutEnlargement: true })
				.jpeg({ quality: 80 })
				.toBuffer();
		}

		const previewBase64 = `data:image/jpeg;base64,${previewBuffer.toString('base64')}`;

		return { previewBase64, gpsCoords };
	}

	/**
	 * Extract GPS from HEIC using exiftool (more reliable than exifr for HEIC)
	 */
	async extractExifFromHeic(buffer: Buffer): Promise<ExifGpsData> {
		const tempFile = join(tmpdir(), `heic-${Date.now()}.heic`);
		try {
			await writeFile(tempFile, buffer);
			const tags = await exiftool.read(tempFile);

			const latitude = tags.GPSLatitude ?? null;
			const longitude = tags.GPSLongitude ?? null;
			const dateTaken = tags.DateTimeOriginal ?? tags.CreateDate ?? null;

			return {
				latitude: typeof latitude === 'number' ? latitude : null,
				longitude: typeof longitude === 'number' ? longitude : null,
				dateTaken: dateTaken instanceof Date ? dateTaken : null
			};
		} catch (error) {
			console.error('Exiftool HEIC extraction error:', error);
			return { latitude: null, longitude: null, dateTaken: null };
		} finally {
			// Clean up temp file
			try {
				await unlink(tempFile);
			} catch {
				// Ignore cleanup errors
			}
		}
	}

	/**
	 * Extract GPS coordinates from image EXIF data
	 * Uses exiftool for HEIC (more reliable), exifr for other formats
	 */
	async extractExifData(buffer: Buffer): Promise<ExifGpsData> {
		// Use exiftool for HEIC files (more reliable)
		if (this.isHeic(buffer)) {
			return this.extractExifFromHeic(buffer);
		}

		try {
			// For non-HEIC, use exifr (faster, no file I/O needed)
			const gps = await exifr.gps(buffer);

			if (gps && gps.latitude !== undefined && gps.longitude !== undefined) {
				const exif = await exifr.parse(buffer, {
					pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate']
				});

				return {
					latitude: gps.latitude,
					longitude: gps.longitude,
					dateTaken: exif?.DateTimeOriginal ?? exif?.CreateDate ?? exif?.ModifyDate ?? null
				};
			}

			// Fallback: try full parse
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
	 * Converts to JPEG first for consistent format
	 */
	async uploadToCloudinary(buffer: Buffer, filename: string): Promise<UploadResult> {
		// Convert to JPEG first (handles HEIC, PNG, etc.)
		const jpegBuffer = await this.convertToJpeg(buffer);

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

			// Convert JPEG buffer to readable stream and pipe to Cloudinary
			const readableStream = new Readable();
			readableStream.push(jpegBuffer);
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
				difficulty: true
			}
		});

		// Shuffle and take requested count
		const shuffled = pictures.sort(() => Math.random() - 0.5);
		return shuffled.slice(0, count);
	}
}
