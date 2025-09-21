const isDevelopment = (process.env.NODE_ENV || 'development') === 'development'

export const logger = {
	debug: (message: string, meta?: unknown) => {
		if (isDevelopment) {
			console.debug(
				`[DEBUG] ${message}`,
				meta ? JSON.stringify(meta, null, 2) : ''
			)
		}
	},
	info: (message: string, meta?: unknown) => {
		console.info(
			`[INFO] ${message}`,
			meta ? JSON.stringify(meta, null, 2) : ''
		)
	},
	warn: (message: string, meta?: unknown) => {
		console.warn(
			`[WARN] ${message}`,
			meta ? JSON.stringify(meta, null, 2) : ''
		)
	},
	error: (message: string, meta?: unknown) => {
		console.error(
			`[ERROR] ${message}`,
			meta ? JSON.stringify(meta, null, 2) : ''
		)
	}
}

// Simple stream for HTTP request logging
export const loggerStream = {
	write: (message: string) => {
		logger.info(message.trim())
	}
}
