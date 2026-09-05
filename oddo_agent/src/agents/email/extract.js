/**
 * Step 3 — Gemini structured extraction.
 *
 * Sends the sanitized email body to Gemini (temperature 0, JSON mime) and
 * validates the response against the Zod EmailExtractionSchema before it is
 * returned. Gemini output is never trusted blindly.
 *
 * Logic preserved from the working Colab prototype (model updated to the one
 * used in the successful run).
 */
import { ai, GEMINI_MODEL } from "../../lib/gemini.js";
import { EmailExtractionSchema } from "../../validation/schemas.js";

/**
 * @typedef {import("../../validation/schemas.js").EmailExtraction} EmailExtraction
 * @typedef {import("./sender.js").Sender} Sender
 */

export async function extractEmail(emailBody, sender) {
  const prompt = `
You are the Email Intelligence Agent for PeoplePay360.

Your job is ONLY to understand and structure an HR/payroll email.

Do NOT perform payroll calculations.
Do NOT approve leave.
Do NOT modify employee data.
Do NOT invent missing information.
Do NOT fall back to later fallback content.

Return ONLY valid JSON.

Sender:
Name: ${sender.name ?? "unknown"}
Email: ${sender.email ?? "unknown"}

Email:
${emailBody}

Rules:

1. Identify the user's intent.

2. Extract employee information if present.

3. This email may be a REPLY. IGNORE all quoted, forwarded or previously-sent
   content (anything after an "On ... wrote:" line, after a forward marker, or
   prefixed with ">"). Extract ONLY what the sender wrote in their newest reply.

4. For leave requests:
   - identify leave type
   - start date
   - end date
   - reason
   - Map common synonyms: annual / earned / casual / vacation leave ->
     PAID_LEAVE; sick / medical leave -> SICK_LEAVE; leave without pay /
     loss of pay / LOP -> UNPAID_LEAVE.

5. For payroll questions:
   - identify payroll period if present
   - preserve the employee's actual question

6. Never invent missing information.

7. If something is missing, return null.

8. confidence must be between 0 and 1.

Output fields:

{
  "intent": "LEAVE_REQUEST" | "PAYROLL_QUERY" | "ATTENDANCE_QUERY" | "POLICY_QUERY" | "ANALYTICS_QUERY" | "OTHER",
  "employeeName": "...",
  "employeeEmail": "...",
  "leaveType": "PAID_LEAVE" | "SICK_LEAVE" | "UNPAID_LEAVE" | "UNKNOWN",
  "startDate": "...",
  "endDate": "...",
  "reason": "...",
  "payrollPeriod": "...",
  "query": "...",
  "confidence": 0.0
}
`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned invalid JSON:\n" + text);
  }

  // IMPORTANT: Gemini output passes through Zod before entering our application.
  const validated = EmailExtractionSchema.safeParse(parsed);

  if (!validated.success) {
    console.error("Zod validation failed:", validated.error.format());

    throw new Error("Gemini response failed schema validation.");
  }

  return validated.data;
}