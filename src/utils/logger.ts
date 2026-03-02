/**
 * Structured logger for production events.
 */

export const logger = {
    info: (message: string, context?: any) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, context || "");
    },
    warn: (message: string, context?: any) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, context || "");
    },
    error: (message: string, context?: any) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, context || "");
    },
    event: (type: string, message: string, data?: any) => {
        console.log(`[EVENT:${type}] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data) : "");
    }
};
