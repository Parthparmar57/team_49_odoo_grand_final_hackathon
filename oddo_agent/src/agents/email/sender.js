/**
 * Step 2 — Sender identification.
 *
 * Pulls the sender name/email from the "From:" header using two regex
 * strategies: a rich header ("From: Rahul Sharma <rahul@technova.com>") and a
 * plain header ("From: rahul@technova.com").
 *
 * Logic preserved from the working Colab prototype.
 */

/**
 * @typedef {Object} Sender
 * @property {string|null} name
 * @property {string|null} email
 */

export function identifySender(rawEmail) {
  // Example:
  // From: Rahul Sharma <rahul@technova.com>

  const fromMatch = rawEmail.match(/From:\s*(?:"?([^"<\n]+)"?\s*)?<([^>\s]+)>/i);

  if (fromMatch) {
    return {
      name: fromMatch[1]?.trim() || null,
      email: fromMatch[2]?.trim() || null,
    };
  }

  // Example:
  // From: rahul@technova.com

  const simpleEmailMatch = rawEmail.match(/From:\s*([^\s<>]+@[^\s<>]+)/i);

  if (simpleEmailMatch) {
    return {
      name: null,
      email: simpleEmailMatch[1].trim(),
    };
  }

  return {
    name: null,
    email: null,
  };
}