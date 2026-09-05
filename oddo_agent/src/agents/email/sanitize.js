/**
 * Step 1 — Sanitization.
 *
 * Cleans a raw email into a plain, searchable body: strips HTML, decodes the
 * most common HTML entities, collapses whitespace, and removes reply /
 * forwarded-message prefixes that would otherwise confuse the extractor.
 *
 * IMPORTANT: reply quote markers ("On ... wrote:", "--- Forwarded message ---")
 * are removed across MULTIPLE LINES so the old conversation from a thread does
 * not bleed into the AI's extraction of the sender's newest reply.
 *
 * Logic preserved from the working Colab prototype (hardened for replies).
 */

export function sanitizeEmail(email) {
  let cleaned = email;

  // Remove style/script blocks entirely, then all other HTML tags.
  cleaned = cleaned
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ");

  // Decode the most common HTML entities.
  cleaned = cleaned
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // Everything from a reply quote marker onward is the OLD conversation.
  // (Multiline — Gmail/Outlook place "On <date> <name> wrote:" + quoted text.)
  cleaned = cleaned.replace(/On [^\n]*?wrote:\s*[\s\S]*$/gi, "");

  // Forwarded / original-message markers (multiline).
  cleaned = cleaned.replace(/-{2,}\s*Forwarded message\s*-{2,}[\s\S]*$/gi, "");
  cleaned = cleaned.replace(/-{2,}\s*Original Message\s*-{2,}[\s\S]*$/gi, "");
  cleaned = cleaned.replace(/-{2,}\s*Original(?: Message)?\s*-{2,}[\s\S]*$/gi, "");

  // Remove any remaining quoted ("> ...") lines.
  cleaned = cleaned
    .split(/\r?\n/)
    .filter((line) => !/^\s*&?gt;|^\s*>/i.test(line))
    .join("\n");

  // Mobile / app reply signatures.
  cleaned = cleaned.replace(/\s*Sent from Mail for (Windows|iOS|Android).*/gi, "");
  cleaned = cleaned.replace(/\s*Sent from my .*/gi, "");

  // Remove excessive whitespace.
  cleaned = cleaned.replace(/\s+/g, " ");

  // Trim
  cleaned = cleaned.trim();

  return cleaned;
}