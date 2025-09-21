import { createMiddleware } from 'hono/factory'

// Simple ID generator to replace UUID
const generateRequestId = () => {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	)
}

export const requestIdMiddleware = createMiddleware<{
	Variables: {
		requestId: string
	}
}>(async (c, next) => {
	const requestId = c.req.header('x-request-id') || generateRequestId()

	c.set('requestId', requestId)
	c.header('x-request-id', requestId)

	await next()
})
