/**
 * Utility functions for input validation and normalization.
 */

/**
 * Validates email format using regex.
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Normalizes email by trimming and converting to lowercase.
 */
export function normalizeEmail(email: string | null): string | null {
    if (!email) return null;
    return email.trim().toLowerCase();
}

/**
 * Normalizes phone number to string.
 */
export function normalizePhone(phone: any): string | null {
    if (phone === null || phone === undefined) return null;
    return String(phone).trim();
}
