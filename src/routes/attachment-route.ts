import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { Hono } from 'hono'

import db from '../db/db.js'
import { s3 } from '../db/s3.js'
import { AppError } from '../utils/errorHandler.js'
import { HTTP_STATUS } from '../utils/http-status.enum.js'

// Helper to get allowed file types as array
const getAllowedFileTypes = (): string[] => {
	const allowedTypes =
		process.env.ALLOWED_FILE_TYPES ||
		'image/jpeg,image/png,image/gif,image/webp'

	return allowedTypes.split(',').map((type) => type.trim())
}

// Simple ID generator to replace UUID
const generateFileId = () => {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	)
}

const attachmentRoute = new Hono().basePath('attachment')

attachmentRoute.post('/create', async (c) => {
	try {
		const body = await c.req.parseBody()
		const file = body['file'] as File

		// Validate file
		if (!file) {
			throw new AppError('No file provided', HTTP_STATUS.BAD_REQUEST)
		}

		// Validate file size
		const maxFileSize = Number(process.env.MAX_FILE_SIZE) || 10485760 // 10MB

		if (file.size > maxFileSize) {
			throw new AppError(
				`File too large. Maximum size is ${maxFileSize / 1024 / 1024}MB`,
				HTTP_STATUS.BAD_REQUEST
			)
		}

		// Validate file type
		const allowedTypes = getAllowedFileTypes()

		if (!allowedTypes.includes(file.type)) {
			throw new AppError(
				`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
				HTTP_STATUS.BAD_REQUEST
			)
		}

		// Generate unique filename
		const fileExtension = file.name.split('.').pop()
		const uniqueFileName = `${generateFileId()}.${fileExtension}`

		const buffer = await file.arrayBuffer()

		// Upload to S3
		await s3.send(
			new PutObjectCommand({
				Bucket: process.env.MINIO_BUCKET_NAME || 'attachments',
				Key: uniqueFileName,
				Body: Buffer.from(buffer),
				ContentType: file.type
			})
		)

		// Save attachment record to database
		const attachment = await db.attachment.create({
			data: {
				bucket: process.env.MINIO_BUCKET_NAME || 'attachments',
				key: uniqueFileName,
				contentType: file.type
			}
		})

		return c.json(
			{
				message: 'File uploaded successfully',
				attachment: {
					id: attachment.id,
					fileName: uniqueFileName,
					contentType: file.type,
					size: file.size
				}
			},
			201
		)
	} catch (error) {
		if (error instanceof AppError) {
			throw error
		}
		throw new AppError(
			'Failed to upload file',
			HTTP_STATUS.INTERNAL_SERVER_ERROR
		)
	}
})

attachmentRoute.get('/:id', async (c) => {
	try {
		const { id } = c.req.param()

		// Get attachment from database
		const attachment = await db.attachment.findUnique({
			where: { id }
		})

		if (!attachment) {
			throw new AppError('Attachment not found', HTTP_STATUS.NOT_FOUND)
		}

		// Get file from S3
		const result = await s3.send(
			new GetObjectCommand({
				Bucket: attachment.bucket,
				Key: attachment.key
			})
		)

		// Convert the stream to a Uint8Array
		const bodyArray = result.Body
			? await result.Body.transformToByteArray()
			: null

		if (!bodyArray) {
			throw new AppError('File content not found', 404)
		}

		// Add cache headers for static assets
		c.header('Cache-Control', 'public, max-age=31536000, immutable')
		c.header('ETag', `"${attachment.key}"`)

		return c.body(Buffer.from(bodyArray), 200, {
			'Content-Type': attachment.contentType,
			'Content-Disposition': `inline; filename="${attachment.key}"`
		})
	} catch (error) {
		if (error instanceof AppError) {
			throw error
		}
		throw new AppError('Failed to retrieve file', 500)
	}
})

export default attachmentRoute
