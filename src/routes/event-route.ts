import { Hono } from 'hono'

import db from '../db/db.js'
import { CreateEventSchema } from '../dto/create-event.dto.js'
import { requireUserSession } from '../middleware/require-user-session-middleware.js'
import { AppError } from '../utils/error-handler.js'
import { HTTP_STATUS } from '../utils/http-status.enum.js'

const eventRoute = new Hono().basePath('event')

// Public route - get all events
eventRoute.get('/all', async (c) => {
	try {
		const allEvents = await db.event.findMany({
			include: {
				tags: true,
				user: {
					select: {
						id: true,
						username: true
					}
				}
			},
			orderBy: {
				startTimeUtc: 'asc'
			}
		})

		return c.json({ events: allEvents })
	} catch {
		throw new AppError('Failed to fetch events', 500)
	}
})

// Get single event by ID
eventRoute.get('/:id', async (c) => {
	try {
		const { id } = c.req.param()

		const event = await db.event.findUnique({
			where: { id },
			include: {
				tags: true,
				user: {
					select: {
						id: true,
						username: true
					}
				}
			}
		})

		if (!event) {
			throw new AppError('Event not found', 404)
		}

		return c.json({ event })
	} catch (error) {
		if (error instanceof AppError) {
			throw error
		}
		throw new AppError('Failed to fetch event', 500)
	}
})

// Authenticated route - create event
eventRoute.post('/create', requireUserSession, async (c) => {
	try {
		const user = c.get('user')
		const body = await c.req.json()
		const result = CreateEventSchema.safeParse(body)

		if (!result.success) {
			throw new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST)
		}

		const createEventData = result.data

		// Convert startTimeUtc string to Date object
		const startTimeUtc = new Date(createEventData.startTimeUtc)

		if (isNaN(startTimeUtc.getTime())) {
			throw new AppError(
				'Invalid date format for startTimeUtc',
				HTTP_STATUS.BAD_REQUEST
			)
		}

		const createdEvent = await db.event.create({
			data: {
				title: createEventData.title,
				game: createEventData.game,
				startTimeUtc: startTimeUtc,
				summary: createEventData.summary,
				longDescription: createEventData.longDescription,
				serverMap: createEventData.serverMap,
				imageUrl: createEventData.imageUrl,
				type: createEventData.type,
				durationMinutes: createEventData.durationMinutes,
				modSizeMb: createEventData.modSizeMb,
				modType: createEventData.modType,
				serverName: createEventData.serverName,
				serverPassword: createEventData.serverPassword ?? null,
				serverRegion: createEventData.serverRegion,
				userId: user.id
			}
		})

		// Create tags for the event
		if (createEventData.tags.length > 0) {
			await db.tag.createMany({
				data: createEventData.tags.map((tagName) => ({
					name: tagName,
					eventId: createdEvent.id
				}))
			})
		}

		// Fetch the created event with tags
		const eventWithTags = await db.event.findUnique({
			where: { id: createdEvent.id },
			include: {
				tags: true,
				user: {
					select: {
						id: true,
						username: true
					}
				}
			}
		})

		return c.json({ event: eventWithTags }, 201)
	} catch (error) {
		if (error instanceof AppError) {
			throw error
		}
		throw new AppError('Failed to create event', 500)
	}
})

export default eventRoute
