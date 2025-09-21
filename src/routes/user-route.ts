import argon2 from 'argon2'
import { Hono } from 'hono'

import db from '../db/db.js'
import { UpdateUserPasswordSchema } from '../dto/update-user-password.dto.js'
import { requireUserSession } from '../middleware/require-user-session-middleware.js'
import { AppError } from '../utils/errorHandler.js'
import { HTTP_STATUS } from '../utils/http-status.enum.js'

const userRoute = new Hono().basePath('user')

userRoute.get('/', requireUserSession, (c) => {
	const user = c.get('user')

	const userDto = {
		id: user.id,
		username: user.username,
		createdAt: user.createdAt
	}

	return c.json({ user: userDto })
})

// Note: You will always need to add async to the route endpoint since the
// sessionAuth middleware is also async since it calls to the database
userRoute.patch('/password', requireUserSession, async (c) => {
	try {
		const user = c.get('user')
		const body = await c.req.json()

		const result = UpdateUserPasswordSchema.safeParse(body)

		if (!result.success) {
			throw new AppError('Validation failed', HTTP_STATUS.BAD_REQUEST)
		}

		const updateUserPasswordDto = result.data

		// Check the original password is correct
		const doGivenPasswordAndCurrentPasswordMatch = await argon2.verify(
			user.password,
			updateUserPasswordDto.currentPassword
		)

		if (!doGivenPasswordAndCurrentPasswordMatch) {
			throw new AppError(
				'Current password is incorrect',
				HTTP_STATUS.BAD_REQUEST
			)
		}

		// Hash the new password
		const newHashedPassword = await argon2.hash(
			updateUserPasswordDto.newPassword
		)

		// Update the password in the database
		await db.user.update({
			where: {
				id: user.id
			},
			data: {
				password: newHashedPassword
			}
		})

		return c.json({
			success: true,
			message: 'Password updated successfully'
		})
	} catch (error) {
		if (error instanceof AppError) {
			throw error
		}
		throw new AppError('Failed to update password', 500)
	}
})

export default userRoute
