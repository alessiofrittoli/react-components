/**
 * Key/value pairs prepended to every log entry.
 *
 */
export type LoggerBindings = Record<string, unknown>

/**
 * Log levels, ordered by severity. `silent` disables every output.
 *
 */
const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'silent'] as const

export type LogLevel = (typeof LOG_LEVELS)[number]

export type Logger = Console & {
	/** Minimum level printed. */
	level: LogLevel
	setLevel(level: LogLevel): void
	/**
	 * Create a child logger whose bindings are merged with the parent ones.
	 *
	 * The child inherits the parent `level` at creation time.
	 *
	 * @param bindings (Optional) Bindings merged over the parent ones.
	 * @returns A new {@link Logger}.
	 */
	child(bindings?: LoggerBindings): Logger
}

/**
 * Check whether `level` is printed by a logger set to `current`.
 *
 * __INTERNAL__
 */
const isLevelEnabled = (current: LogLevel, level: LogLevel): boolean =>
	LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(current)

export const createLogger = (bindings: LoggerBindings = {}, level: LogLevel = 'info'): Logger => {
	/** Empty bindings are omitted so no `{}` is printed. */
	const prefix = Object.keys(bindings).length > 0 ? [bindings] : []

	return {
		...console,
		level,
		setLevel(value) {
			this.level = value
		},
		debug(...args) {
			if (isLevelEnabled(this.level, 'debug')) {
				console.debug(...prefix, ...args)
			}
		},
		log(...args) {
			if (isLevelEnabled(this.level, 'info')) {
				console.log(...prefix, ...args)
			}
		},
		info(...args) {
			if (isLevelEnabled(this.level, 'info')) {
				console.info(...prefix, ...args)
			}
		},
		warn(...args) {
			if (isLevelEnabled(this.level, 'warn')) {
				console.warn(...prefix, ...args)
			}
		},
		error(...args) {
			if (isLevelEnabled(this.level, 'error')) {
				console.error(...prefix, ...args)
			}
		},
		child(childBindings) {
			return createLogger({ ...bindings, ...childBindings }, this.level)
		},
	}
}

export const logger = createLogger()
