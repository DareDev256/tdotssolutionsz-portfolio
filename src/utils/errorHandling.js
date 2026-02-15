/**
 * Centralized error handling — structured logging with actionable context.
 * Replaces silent catch blocks with categorized, debug-friendly error reports.
 * @module utils/errorHandling
 */

/** Error categories for structured filtering in DevTools */
export const ErrorCategory = Object.freeze({
    STORAGE: 'storage',
    NETWORK: 'network',
    PLAYER: 'player',
    RENDER: 'render',
    PARSE: 'parse',
})

/**
 * Log an error with structured context for DevTools debugging.
 * Groups by category so developers can filter by error type.
 * @param {string} category - One of ErrorCategory values
 * @param {string} action - What was being attempted (e.g. "loadVideoById")
 * @param {unknown} error - The caught error/value
 * @param {Record<string, unknown>} [context] - Extra diagnostic data
 */
export function logError(category, action, error, context) {
    const entry = {
        category,
        action,
        message: error instanceof Error ? error.message : String(error ?? 'unknown'),
        ...(context && { context }),
        timestamp: new Date().toISOString(),
    }

    // Grouped console output — collapsible in DevTools, filterable by prefix
    if (import.meta.env?.DEV) {
        console.groupCollapsed(`[${category}] ${action}`)
        console.error(entry)
        if (error instanceof Error && error.stack) console.debug(error.stack)
        console.groupEnd()
    } else {
        // Production: single-line structured log (no stack traces)
        console.warn(`[${category}] ${action}:`, entry.message)
    }

    return entry
}

/**
 * Wrap a function with automatic error logging + fallback value.
 * Useful for localStorage reads, URL parsing, and other recoverable ops.
 * @template T
 * @param {string} category
 * @param {string} action
 * @param {() => T} fn - The operation to attempt
 * @param {T} fallback - Value to return on failure
 * @param {Record<string, unknown>} [context]
 * @returns {T}
 */
export function withRecovery(category, action, fn, fallback, context) {
    try {
        return fn()
    } catch (error) {
        logError(category, action, error, context)
        return fallback
    }
}
