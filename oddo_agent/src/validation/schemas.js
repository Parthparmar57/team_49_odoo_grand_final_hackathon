/**
 * Zod schemas for the PeoplePay360 email intelligence pipeline.
 *
 * The LLM is never trusted blindly. Every structured response it produces is
 * validated against these schemas before it is allowed to influence any
 * downstream decision or database write.
 */
import { z } from "zod";

/**
 * Intents the Email Intelligence Agent is allowed to classify an email as.
 * Anything else is routed as OTHER and never acted upon directly.
 */
export const Intent = z.enum([
  "LEAVE_REQUEST",
  "PAYROLL_QUERY",
  "ATTENDANCE_QUERY",
  "POLICY_QUERY",
  "ANALYTICS_QUERY",
  "OTHER",
]);

/**
 * Leave types we understand. UNKNOWN is used when the model could not map the
 * leave to one of our known types. Common synonyms are included so a reply
 * that says "casual leave" or "loss of pay" does not fail schema validation;
 * normalize.js maps them all down to the domain codes (PL / SL / UL).
 */
export const LeaveType = z.enum([
  "PAID_LEAVE",
  "SICK_LEAVE",
  "UNPAID_LEAVE",
  "ANNUAL_LEAVE",
  "EARNED_LEAVE",
  "CASUAL_LEAVE",
  "VACATION_LEAVE",
  "MEDICAL_LEAVE",
  "LEAVE_WITHOUT_PAY",
  "LOSS_OF_PAY",
  "UNKNOWN",
]);

/**
 * Structured extraction that Gemini produces from a raw email.
 *
 * Every field that may legitimately be absent is nullable — the model is
 * explicitly told never to invent missing information, and null lets the
 * downstream completeness check decide what still needs clarifying.
 */
export const EmailExtractionSchema = z.object({
  intent: Intent,

  employeeName: z.string().nullable(),
  employeeEmail: z.string().nullable(),

  // Nullable because intents like PAYROLL_QUERY have no leave type.
  leaveType: LeaveType.nullable(),

  startDate: z.string().nullable(),
  endDate: z.string().nullable(),

  reason: z.string().nullable(),

  payrollPeriod: z.string().nullable(),

  query: z.string().nullable(),

  confidence: z.number().min(0).max(1),
});

/**
 * Inferred TypeScript-style type of an email extraction.
 * @typedef {z.infer<typeof EmailExtractionSchema>} EmailExtraction
 */

/**
 * Homogeneous shape used after normalization. Dates converted to YYYY-MM-DD,
 * leave type converted to a domain code (PL / SL / UL).
 */
export const NormalizedExtractionSchema = z.object({
  intent: z.string().nullable(),
  employeeName: z.string().nullable(),
  employeeEmail: z.string().nullable(),
  leaveType: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  reason: z.string().nullable(),
  payrollPeriod: z.string().nullable(),
  query: z.string().nullable(),
});

export { z };
