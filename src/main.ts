import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { corsConfig } from './config/cors-config.js'
import { logger } from './logger/logger.js'
import { rateLimiterMiddleware } from './middleware/rate-limiter-middleware.js'
import { requestIdMiddleware } from './middleware/request-id-middleware.js'
import attachmentRoute from './routes/attachment-route.js'
import authRoute from './routes/auth-route.js'
import eventRoute from './routes/event-route.js'
import healthRoute from './routes/health-route.js'
import userRoute from './routes/user-route.js'
import { errorHandler } from './utils/error-handler.js'

const app = new Hono()

// Global error handler
app.onError(errorHandler)

// Core middlewares (order matters!)
app.use('*', requestIdMiddleware)
app.use('*', rateLimiterMiddleware)
app.use('*', cors(corsConfig))

// Simple root health endpoint that redirects to proper health check
app.get('/health', (c) => c.redirect('/health/'))

// API Routes
const apiRoutes = [
	userRoute,
	authRoute,
	eventRoute,
	attachmentRoute,
	healthRoute
]

for (const route of apiRoutes) {
	app.route('/api', route)
}

// Start server
const port = Number(process.env.PORT) || 3000

serve(
	{
		fetch: app.fetch,
		port
	},
	(info) => {
		logger.info('🚀 Server started successfully', {
			port: info.port,
			environment: process.env.NODE_ENV || 'development',
			nodeVersion: process.version,
			pid: process.pid
		})

		console.log(`🚀 Server is running on http://localhost:${info.port}`)
		console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
		console.log(`\n📋 Health Endpoints:`)
		console.log(
			`🏥 Health check:     http://localhost:${info.port}/api/health`
		)
		console.log(
			`🏥 Health check:     http://localhost:${info.port}/api/health/detailed`
		)
	}
)

// Graceful shutdown
const gracefulShutdown = () => {
	logger.info('Shutting down gracefully...')
	process.exit(0)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
