import pino from 'pino';

export function getLogger(component: string): pino.Logger {
    return pino({ name: component });
}
