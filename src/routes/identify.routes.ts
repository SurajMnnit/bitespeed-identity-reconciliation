/**
 * Route definitions for the identity reconciliation API.
 */

import { Router } from "express";
import { identifyController } from "../controllers";

const router = Router();

// POST /identify — consolidate customer contacts
router.post("/identify", identifyController);

export default router;
