import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.join(__dirname, '../../logs');

// Create logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple logger using built-in console and file logging
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    if (Object.keys(meta).length > 0) {
      return `${baseMessage} ${JSON.stringify(meta)}`;
    }

    return baseMessage;
  }

  logToFile(filename, message) {
    const logPath = path.join(logsDir, filename);
    const logEntry = message + '\n';

    try {
      fs.appendFileSync(logPath, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  error(message, meta = {}) {
    const formatted = this.formatMessage('error', message, meta);
    console.error(`\x1b[31m${formatted}\x1b[0m`); // Red
    this.logToFile('error.log', formatted);
  }

  warn(message, meta = {}) {
    const formatted = this.formatMessage('warn', message, meta);
    console.warn(`\x1b[33m${formatted}\x1b[0m`); // Yellow
    this.logToFile('all.log', formatted);
  }

  info(message, meta = {}) {
    const formatted = this.formatMessage('info', message, meta);
    console.info(`\x1b[32m${formatted}\x1b[0m`); // Green
    this.logToFile('all.log', formatted);
  }

  http(message, meta = {}) {
    const formatted = this.formatMessage('http', message, meta);
    if (this.isDevelopment) {
      console.log(`\x1b[35m${formatted}\x1b[0m`); // Magenta
    }
    this.logToFile('all.log', formatted);
  }

  debug(message, meta = {}) {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('debug', message, meta);
      console.debug(`\x1b[37m${formatted}\x1b[0m`); // White
      this.logToFile('all.log', formatted);
    }
  }
}

const logger = new Logger();
export default logger;