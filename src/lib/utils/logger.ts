type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  minLevel: LogLevel;
  prefix?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      minLevel: config.minLevel || (import.meta.env.DEV ? 'debug' : 'warn'),
      prefix: config.prefix,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): unknown[] {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    const levelStr = level.toUpperCase().padEnd(5);

    return [`[${timestamp}] ${levelStr} ${prefix} ${message}`, ...args];
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(...this.formatMessage('debug', message, ...args));
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', message, ...args));
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', message, ...args));
    }
  }

  error(message: string, error?: unknown, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      if (error instanceof Error) {
        console.error(...this.formatMessage('error', message, ...args), '\n', error.stack || error);
      } else {
        console.error(...this.formatMessage('error', message, ...args), error);
      }
    }
  }

  /**
   * Create a child logger with a specific prefix
   */
  child(prefix: string): Logger {
    const childPrefix = this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix;
    return new Logger({ ...this.config, prefix: childPrefix });
  }
}

// Create default logger
export const logger = new Logger();

// Create module-specific loggers
export const walletLogger = logger.child('Wallet');
export const messagesLogger = logger.child('Messages');
export const npubCashLogger = logger.child('NpubCash');
