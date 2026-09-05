/**
 * Email Intelligence Agent.
 *
 * Reads natural-language employee emails and turns them into a validated,
 * normalized, structured result for the HR Orchestrator.
 *
 * Pipeline (unchanged from the working prototype):
 *   [1] Sanitize    -> sanitizeEmail
 *   [2] Sender      -> identifySender
 *   [3] Extract     -> extractEmail (Gemini + Zod)
 *   [4] Normalize   -> normalizeExtraction
 *   [5] Completeness-> findMissingInformation
 *   + if incomplete -> clarification email
 *
 * The agent NEVER modifies data, approves leave, or calculates payroll. It
 * only understands and structures the request.
 */
import { sanitizeEmail } from "./email/sanitize.js";
import { identifySender } from "./email/sender.js";
import { extractEmail } from "./email/extract.js";
import { normalizeExtraction } from "./email/normalize.js";
import { findMissingInformation, generateClarificationEmail } from "./email/completeness.js";

/**
 * Flow status of an emailed request after the Email Intelligence Agent has
 * processed it:
 *   - READY              -> can be handed to the HR Orchestrator
 *   - NEEDS_CLARIFICATION-> employee must provide missing fields
 *   - HUMAN_REVIEW       -> reserved for flagging ambiguous/conflicted input
 */
const STATUS = {
  READY: "READY",
  NEEDS_CLARIFICATION: "NEEDS_CLARIFICATION",
  HUMAN_REVIEW: "HUMAN_REVIEW",
};

/**
 * Process a raw employee email.
 *
 * @param {string} rawEmail raw email (headers + body)
 * @returns {Promise<{
 *   status: "READY"|"NEEDS_CLARIFICATION"|"HUMAN_REVIEW",
 *   sender: { name: string|null, email: string|null },
 *   extraction: import("../../validation/schemas.js").EmailExtraction|null,
 *   normalized: object|null,
 *   missingFields: string[],
 *   clarificationEmail: string|null
 * }>}
 */
export async function emailIntelligenceAgent(rawEmail) {
  console.log("\n========================================");
  console.log("EMAIL INTELLIGENCE AGENT");
  console.log("========================================");

  // ----------------------------------------------------------
  // STEP 1
  // ----------------------------------------------------------

  console.log("\n[1] Sanitizing email...");

  const cleanedEmail = sanitizeEmail(rawEmail);

  console.log("✓ Email sanitized");

  // ----------------------------------------------------------
  // STEP 2
  // ----------------------------------------------------------

  console.log("\n[2] Identifying sender...");

  const sender = identifySender(rawEmail);

  console.log("Sender:", sender);

  // ----------------------------------------------------------
  // STEP 3
  // ----------------------------------------------------------

  console.log("\n[3] Gemini structured extraction...");

  const extraction = await extractEmail(cleanedEmail, sender);

  console.log("✓ Structured extraction successful");
  console.log(JSON.stringify(extraction, null, 2));

  // ----------------------------------------------------------
  // STEP 4
  // ----------------------------------------------------------

  console.log("\n[4] Normalizing data...");

  const normalized = normalizeExtraction(extraction, sender);

  console.log(JSON.stringify(normalized, null, 2));

  // ----------------------------------------------------------
  // STEP 5
  // ----------------------------------------------------------

  console.log("\n[5] Checking completeness...");

  const missingFields = findMissingInformation(extraction, normalized);

  if (missingFields.length > 0) {
    console.log("⚠ Missing information:", missingFields);

    const clarificationEmail = generateClarificationEmail(sender, missingFields);

    console.log("\n[CLARIFICATION EMAIL]");
    console.log(clarificationEmail);

    return {
      status: STATUS.NEEDS_CLARIFICATION,
      sender,
      extraction,
      normalized,
      missingFields,
      clarificationEmail,
    };
  }

  console.log("\n✓ Email contains required information");
  console.log("✓ Ready for HR Orchestrator");

  return {
    status: STATUS.READY,
    sender,
    extraction,
    normalized,
    missingFields: [],
    clarificationEmail: null,
  };
}