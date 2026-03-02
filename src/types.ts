/**
 * Shared TypeScript types for the Identity Reconciliation service.
 */

// ─── Request / Response Types ────────────────────────────────────────────────

/** Body of the POST /identify request */
export interface IdentifyRequest {
    email?: string | null;
    phoneNumber?: string | null;
}

/** Shape of the successful /identify response */
export interface IdentifyResponse {
    contact: {
        primaryContatctId: number;       // (sic) – matches the assignment spec typo
        emails: string[];                // primary email first
        phoneNumbers: string[];          // primary phone first
        secondaryContactIds: number[];
    };
}

// ─── Domain Types ────────────────────────────────────────────────────────────

/** Enum-like union for link precedence */
export type LinkPrecedence = "primary" | "secondary";

/** A Contact row as returned by Prisma (simplified for service use) */
export interface ContactRow {
    id: number;
    phoneNumber: string | null;
    email: string | null;
    linkedId: number | null;
    linkPrecedence: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
