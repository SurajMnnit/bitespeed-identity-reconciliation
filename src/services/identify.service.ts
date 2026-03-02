/**
 * Identity Reconciliation Service
 * 
 * Production-ready logic with:
 * - Transaction handling
 * - Merge event logging
 * - Soft delete awareness
 */

import { Prisma } from "@prisma/client";
import prisma from "../prisma";
import { ContactRow, IdentifyRequest, IdentifyResponse } from "../types";
import { logger } from "../utils/logger";
import { buildIdentifyResponse } from "../utils/response";

// Transaction client type - use any to bypass complex Prisma transaction typing in v5
type TransactionClient = any;

/**
 * Main service entry point.
 */
export async function identifyContact(body: IdentifyRequest): Promise<IdentifyResponse> {
    const { email, phoneNumber } = body;

    // Wrap entire operation in a transaction for consistency
    return prisma.$transaction(async (tx) => {
        // ── Step 1: Find directly matching contacts ──────────────────────────
        const directMatches = await findDirectMatches(tx, email || null, phoneNumber || null);

        // ── Step 2: No matches → create a brand-new primary contact ─────────
        if (directMatches.length === 0) {
            const newContact = await tx.contact.create({
                data: {
                    email: email || null,
                    phoneNumber: phoneNumber || null,
                    linkPrecedence: "primary",
                },
            });
            return buildIdentifyResponse(newContact as ContactRow, []);
        }

        // ── Step 3: Expand to full cluster (follow all linkedId chains) ─────
        const cluster = await expandCluster(tx, directMatches as ContactRow[]);

        // ── Step 4: Determine THE primary (oldest by createdAt) ─────────────
        const primary = cluster.reduce((oldest, c) =>
            c.createdAt < oldest.createdAt ? c : oldest
        );

        // ── Step 5: Demote any other primaries → secondary ──────────────────
        const contactsToDemote = cluster.filter(
            (c) => c.id !== primary.id && c.linkPrecedence === "primary"
        );

        for (const contact of contactsToDemote) {
            logger.event("MERGE", `Converting contact ${contact.id} from primary to secondary. Linking to ${primary.id}.`);

            await tx.contact.update({
                where: { id: contact.id },
                data: {
                    linkPrecedence: "secondary",
                    linkedId: primary.id,
                },
            });

            // Re-link any secondaries that pointed at the demoted primary to the new cluster root
            await tx.contact.updateMany({
                where: { linkedId: contact.id },
                data: { linkedId: primary.id },
            });

            // Local cluster object update
            contact.linkPrecedence = "secondary";
            contact.linkedId = primary.id;
        }

        // ── Step 6: Create new secondary if request has novel information ────
        const clusterEmails = new Set(cluster.map((c) => c.email).filter(Boolean));
        const clusterPhones = new Set(cluster.map((c) => c.phoneNumber).filter(Boolean));

        const hasNewEmail = email && !clusterEmails.has(email);
        const hasNewPhone = phoneNumber && !clusterPhones.has(phoneNumber);

        if (hasNewEmail || hasNewPhone) {
            logger.event("NEW_SECONDARY", `Creating secondary contact for ${email || 'NONE'}/${phoneNumber || 'NONE'}`);

            const newSecondary = await tx.contact.create({
                data: {
                    email: email || null,
                    phoneNumber: phoneNumber || null,
                    linkedId: primary.id,
                    linkPrecedence: "secondary",
                },
            });
            cluster.push(newSecondary as ContactRow);
        }

        // ── Step 7: Build consolidated response ──────────────────────────────
        const secondaries = cluster.filter((c) => c.id !== primary.id);
        return buildIdentifyResponse(primary, secondaries);
    });
}

/**
 * Finds contacts matching email OR phoneNumber (excluding deleted).
 */
async function findDirectMatches(
    tx: TransactionClient,
    email: string | null,
    phoneNumber: string | null
): Promise<ContactRow[]> {
    const orConditions: Array<Record<string, string>> = [];
    if (email) orConditions.push({ email });
    if (phoneNumber) orConditions.push({ phoneNumber });

    if (orConditions.length === 0) return [];

    const contacts = await tx.contact.findMany({
        where: {
            deletedAt: null, // Soft-delete aware
            OR: orConditions,
        },
        orderBy: { createdAt: "asc" },
    });

    return contacts as ContactRow[];
}

/**
 * Walks linkedId relationships to collect the full connected cluster.
 */
async function expandCluster(
    tx: TransactionClient,
    directMatches: ContactRow[]
): Promise<ContactRow[]> {
    const primaryIds = new Set<number>();

    for (const contact of directMatches) {
        if (contact.linkPrecedence === "primary") {
            primaryIds.add(contact.id);
        } else if (contact.linkedId !== null) {
            primaryIds.add(contact.linkedId);
        }
    }

    if (primaryIds.size === 0) return directMatches;

    const allRelated = await tx.contact.findMany({
        where: {
            deletedAt: null, // Soft-delete aware
            OR: [
                { id: { in: Array.from(primaryIds) } },
                { linkedId: { in: Array.from(primaryIds) } },
            ],
        },
        orderBy: { createdAt: "asc" },
    });

    const seen = new Map<number, ContactRow>();
    for (const c of allRelated) {
        seen.set(c.id, c as ContactRow);
    }

    return Array.from(seen.values());
}

