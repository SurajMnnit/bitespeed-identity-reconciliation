/**
 * Controller for the /identify endpoint.
 * Performs validation and delegates to service.
 */

import { Request, Response, NextFunction } from "express";
import { identifyContact } from "../services";
import { IdentifyRequest } from "../types";
import { isValidEmail, normalizeEmail, normalizePhone } from "../utils/validation";
import { AppError } from "../middleware/errorHandler";

/**
 * Handle POST /identify
 */
export async function identifyController(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        let { email, phoneNumber } = req.body as IdentifyRequest;

        // Normalization
        const normEmail = normalizeEmail(email || null);
        const normPhone = normalizePhone(phoneNumber || null);

        // Required field validation
        if (!normEmail && !normPhone) {
            const err: AppError = new Error("At least one of email or phoneNumber must be provided");
            err.status = 400;
            throw err;
        }

        // Regex format validation for email
        if (normEmail && !isValidEmail(normEmail)) {
            const err: AppError = new Error("Invalid email format");
            err.status = 400;
            throw err;
        }

        const result = await identifyContact({
            email: normEmail as string,
            phoneNumber: normPhone as string
        });

        res.status(200).json(result);
    } catch (error) {
        // Delegate to global error handler
        next(error);
    }
}
