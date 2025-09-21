import argon2 from 'argon2'
import { Hono } from 'hono'
import { z } from 'zod'

import db from '../db/db.js'
import { requireUserSession } from '../middleware/require-user-session-middleware.js'
import { AppError } from '../utils/errorHandler.js'
import { HTTP_STATUS } from '../utils/http-status.enum.js'

const authRoute = new Hono().basePath('auth')

const SESSION_COOKIE = 'session_id'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

const RegisterUserSchema = z.object({
	username: z.string().min(4),
	password: z.string().min(8)
})

authRoute.post('/register', async (c) => {
	try {
		const body = await c.req.json()
		const parse = RegisterUserSchema.safeParse(body)

		if (!parse.success) {
			throw new AppError('Invalid input', HTTP_STATUS.BAD_REQUEST)
		}

		const { username, password } = parse.data
		const existing = await db.user.findUnique({ where: { username } })

		if (existing) {
			throw new AppError('Username already taken', HTTP_STATUS.CONFLICT)
		}

		const hashed = await argon2.hash(password)
		const user = await db.user.create({
			data: { username, password: hashed }
		})

		return c.json(
			{
				success: true,
				user: { id: user.id, username: user.username }
			},
			201
		)
	} catch (error) {
		if (error instanceof AppError) {
			throw error
		}
		throw new AppError(
			'Registration failed',
			HTTP_STATUS.INTERNAL_SERVER_ERROR
		)
	}
})

const LoginSchema = z.object({ username: z.string(), password: z.string() })

authRoute.post('/login', async (c) => {
	try {
		const body = await c.req.json()
		const parse = LoginSchema.safeParse(body)

		if (!parse.success) {
			throw new AppError('Invalid input', HTTP_STATUS.BAD_REQUEST)
		}

		const { username, password } = parse.data

		// Always hash a dummy password to prevent timing attacks
		const dummyHash =
			'$argon2id$v=19$m=65536,t=3,p=4$DummyHashToPreventTimingAttacks'

		const user = await db.user.findUnique({ where: { username } })

		// Verify password (or dummy hash if user doesn't exist)
		const passwordToVerify = user?.password || dummyHash
		const valid = await argon2.verify(passwordToVerify, password)

		// Check if user exists AND password is valid
		if (!user || !valid) {
			throw new AppError('Invalid credentials', HTTP_STATUS.UNAUTHORIZED)
		}

		// Create session
		const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)
		const session = await db.session.create({
			data: {
				userId: user.id,
				userAgent: c.req.header('user-agent') || '',
				expiresAt: expiresAt
			}
		})

		c.header(
			'Set-Cookie',
			`${SESSION_COOKIE}=${session.id}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Strict; Secure`
		)

		// Return user data along with success
		return c.json({
			success: true,
			user: {
				id: user.id,
				username: user.username
			}
		})
	} catch (error) {
		if (error instanceof AppError) {
			throw error
		}
		throw new AppError('Login failed', HTTP_STATUS.INTERNAL_SERVER_ERROR)
	}
})

// Quick session check endpoint for frontend, don't need to verify user because that is already done in sessionAuth middleware
authRoute.get('session', requireUserSession, async (c) => {
	const user = c.get('user')

	return c.json({
		authenticated: true,
		user: {
			id: user.id,
			username: user.username
		}
	})
})

authRoute.post('logout', requireUserSession, async (c) => {
	const sessionId = c.req
		.header('cookie')
		?.split(';')
		.find((cookie) => cookie.trim().startsWith(`${SESSION_COOKIE}=`))
		?.split('=')[1]

	if (sessionId) {
		await db.session.delete({
			where: { id: sessionId }
		})
	}

	// Clear the session cookie
	c.header(
		'Set-Cookie',
		`${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure`
	)

	return c.json({ success: true })
})

export default authRoute
