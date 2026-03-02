/**
 * Utility for formatting the consolidated identity response.
 */

import { ContactRow, IdentifyResponse } from "../types";

/**
 * Standardizes the response shape for /identify.
 */
export function buildIdentifyResponse(primary: ContactRow, secondaries: ContactRow[]): IdentifyResponse {
    // Collect unique emails — primary email comes first
    const emails: string[] = [];
    if (primary.email) emails.push(primary.email);
    for (const s of secondaries) {
        if (s.email && !emails.includes(s.email)) {
            emails.push(s.email);
        }
    }

    // Collect unique phone numbers — primary phone comes first
    const phoneNumbers: string[] = [];
    if (primary.phoneNumber) phoneNumbers.push(primary.phoneNumber);
    for (const s of secondaries) {
        if (s.phoneNumber && !phoneNumbers.includes(s.phoneNumber)) {
            phoneNumbers.push(s.phoneNumber);
        }
    }

    // Collect secondary IDs
    const secondaryContactIds = secondaries.map((s) => s.id);

    return {
        contact: {
            primaryContatctId: primary.id,   // (sic) — required by specification
            emails,
            phoneNumbers,
            secondaryContactIds,
        },
    };
}
