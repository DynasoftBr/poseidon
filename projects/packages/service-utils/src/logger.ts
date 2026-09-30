import pino from 'pino';

/**
 * Creates a logger bound to a component name.
 * @param {string} component - Component name attached to log records.
 * @returns {pino.Logger} Logger bound to the supplied component.
 */
export function getLogger(component: string): pino.Logger {
    return pino({ name: component });
}
