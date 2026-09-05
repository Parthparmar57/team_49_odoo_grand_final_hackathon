/**
 * Step 5 — Completeness check + clarification email generation.
 *
 * Decides whether the extracted information is sufficient to hand off to the
 * HR Orchestrator, and if not, produces a clear email asking the employee for
 * exactly what is missing.
 *
 * Logic preserved from the working Colab prototype.
 */

/**
 * @typedef {import("../../validation/schemas.js").EmailExtraction} EmailExtraction
 * @typedef {import("./sender.js").Sender} Sender
 * @typedef {import("./normalize.js")} NormalizedExtraction
 */
import { renderTemplate } from "./templates.js";

export function findMissingInformation(extraction, normalized) {
  const missing = [];

  // Leave request
  if (extraction.intent === "LEAVE_REQUEST") {
    if (!normalized.employeeName && !normalized.employeeEmail) {
      missing.push("employee identity");
    }

    if (!normalized.leaveType) {
      missing.push("leave type");
    }

    if (!normalized.startDate) {
      missing.push("start date");
    }

    if (!normalized.endDate) {
      missing.push("end date");
    }

    if (!normalized.reason) {
      missing.push("reason for leave");
    }
  }

  // Payroll query
  if (extraction.intent === "PAYROLL_QUERY") {
    if (!normalized.employeeName && !normalized.employeeEmail) {
      missing.push("employee identity");
    }

    if (!normalized.query) {
      missing.push("payroll question");
    }
  }

  return missing;
}

export function generateClarificationEmail(sender, missingFields) {
  const employee = sender.name || "Employee";

  const readableFields = missingFields.map((field) => `- ${field}`).join("\n");

  const { subject, body } = renderTemplate("leave.clarification", {
    Name: employee,
    MissingFields: readableFields,
  });

  return `Subject: ${subject}\n\n${body}`;
}