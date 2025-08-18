import winston from 'winston';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

const transports: winston.transport[] = [];

// Always log to console so Render captures output
transports.push(
	new winston.transports.Console({
		format: winston.format.combine(
			winston.format.colorize(),
			winston.format.simple()
		)
	})
);

// In non-production, also log to files (create directory if missing)
if (config.env !== 'production') {
	try {
		const logsDir = path.resolve(process.cwd(), 'logs');
		if (!fs.existsSync(logsDir)) {
			fs.mkdirSync(logsDir, { recursive: true });
		}
		transports.push(
			new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' })
		);
		transports.push(
			new winston.transports.File({ filename: path.join(logsDir, path.basename(config.logging.file)) })
		);
	} catch (err) {
		// Fall back to console-only if file transports fail
		// eslint-disable-next-line no-console
		console.warn('File logging disabled:', err);
	}
}

const logger = winston.createLogger({
	level: config.logging.level,
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.errors({ stack: true }),
		winston.format.json()
	),
	defaultMeta: { service: 'lyra-ai-backend' },
	transports
});

export default logger;