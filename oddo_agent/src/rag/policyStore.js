/**
 * RAG — company policy knowledge store.
 *
 * Holds company policies (leave policy, payroll rules, handbook). Stand-in
 * for PostgreSQL + pgvector semantic retrieval. Documents are matched by
 * keyword/tag scoring for now; the retrieval function signature mirrors the
 * eventual vector-based search.
 *
 * IMPORTANT: RAG contains POLICY knowledge only. It is NOT live
 * employee/payroll truth — an employee's real balance always comes from the
 * deterministic services, never from these documents.
 */

const policyDocuments = [
  {
    id: "policy_001",
    category: "LEAVE_POLICY",
    title: "Leave Types and Allocation",
    content:
      "Employees receive 18 days of Paid Leave (PL) and 12 days of Sick Leave (SL) per year. Unpaid Leave (UL) is not allocated and is deducted from pay. Leave year runs January to December.",
    tags: ["leave", "allocation", "paid leave", "sick leave", "unpaid leave", "balance"],
  },
  {
    id: "policy_002",
    category: "LEAVE_POLICY",
    title: "Leave Application Rules",
    content:
      "Leave must be requested with the start date, end date and a short reason. Requests are created as PENDING_APPROVAL and require manager approval before leave is taken. Requests for more than 3 consecutive days require department-head approval.",
    tags: ["leave", "application", "approval", "pending approval", "manager approval"],
  },
  {
    id: "policy_003",
    category: "LEAVE_POLICY",
    title: "Sick Leave Procedure",
    content:
      "Sick leave can be taken with a valid reason. For sick leave lasting more than 2 days, a medical certificate must be submitted to HR. Sick leave does not require prior manager approval, but must still be reported to HR.",
    tags: ["sick leave", "medical certificate", "leave", "absence"],
  },
  {
    id: "policy_004",
    category: "LEAVE_POLICY",
    title: "Unpaid Leave and Earnings",
    content:
      "Unpaid leave is deducted from the employee's monthly pay on a per-day basis. The day rate is computed deterministically from the salary structure, never by estimation.",
    tags: ["unpaid leave", "deduction", "loss of pay", "lop", "pay"],
  },
  {
    id: "policy_005",
    category: "PAYROLL_RULES",
    title: "Loss of Pay Calculation",
    content:
      "Loss of pay is the day rate multiplied by the number of unpaided leave days in the month. The day rate is the monthly gross divided by the number of working days in that month.",
    tags: ["payroll", "loss of pay", "lop", "deduction", "day rate"],
  },
  {
    id: "policy_006",
    category: "HANDBOOK",
    title: "Employee Handbook — Attendance",
    content:
      "Working week is Monday to Saturday. Sunday is an off day. Official company holidays are announced by HR at the start of every year.",
    tags: ["handbook", "attendance", "working days", "schedule", "holiday"],
  },
];

// ============================================================
// RETRIEVAL
// RLACE WITH pgvector SEMANTIC SEARCH WHEN CONNECTED
// ============================================================

const KEYWORD_INDEX = buildKeywordIndex();

function buildKeywordIndex() {
  const index = new Map(); // keyword -> [documentId, ...]
  for (const doc of policyDocuments) {
    for (const rawTag of doc.tags) {
      const tag = rawTag.toLowerCase();
      // Index the full tag AND each word so queries like "paid" or "leave"
      // match the multi-word tag "Paid Leave".
      const words = [...new Set([tag, ...tag.split(/\s+/).filter((w) => w.length > 1)])];
      for (const word of words) {
        if (!index.has(word)) {
          index.set(word, []);
        }
        index.get(word).push(doc.id);
      }
    }
  }
  return index;
}

function scoreDocument(doc, queryTerms) {
  const content = doc.content.toLowerCase();
  const title = doc.title.toLowerCase();
  const tagWords = new Set(
    doc.tags.flatMap((tag) => tag.toLowerCase().split(/\s+/))
  );

  let score = 0;
  for (const term of queryTerms) {
    if (tagWords.has(term) || doc.tags.some((tag) => tag.toLowerCase() === term)) {
      score += 3;
    } else if (content.includes(term)) {
      score += 2;
    }
    if (title.includes(term)) {
      score += 1;
    }
  }
  return score;
}

/**
 * Retrieve relevant policy documents for a query.
 * Returns top-k documents sorted by relevance with a crude score.
 */
export function searchPolicy(query, category, topK = 3) {
  const queryTerms = String(query || "")
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);

  let candidates = policyDocuments;
  if (category) {
    candidates = candidates.filter((doc) => doc.category === category);
  }

  const scored = candidates.map((doc) => ({
    doc,
    score: scoreDocument(doc, queryTerms),
  }));

  scored.sort((a, b) => b.score - a.score);

  const results = scored
    .filter((entry) => entry.score >= 2)
    .slice(0, topK)
    .map(({ doc, score }) => ({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      snippet: doc.content,
      score,
    }));

  return results;
}

export function getAllPolicyDocuments() {
  return policyDocuments;
}