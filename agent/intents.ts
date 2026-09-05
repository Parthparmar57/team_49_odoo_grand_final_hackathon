import intentsData from "./intents.json";

export type IntentCategory = "LEAVE" | "PAYROLL" | "ATTENDANCE" | "ANALYTICS" | "GENERAL_HR" | "FALLBACK";

export type AgentName = "LeaveAgent" | "PayrollAgent" | "AnalyticsAgent" | "HRManagerAgent" | "EmailIntelligenceAgent";

export interface IntentDefinition {
  intent: string;
  category: IntentCategory;
  targetAgent: AgentName;
  description: string;
  keywords: string[];
  requiredEntities: string[];
  optionalEntities: string[];
}

export interface IntentsRegistry {
  version: string;
  description: string;
  intents: IntentDefinition[];
}

export const INTENTS_CATALOG: IntentsRegistry = intentsData as IntentsRegistry;

/**
 * Helper to retrieve an intent definition by its name
 */
export function getIntentDefinition(intentName: string): IntentDefinition | undefined {
  return INTENTS_CATALOG.intents.find((item) => item.intent === intentName);
}

/**
 * Fast keyword matching helper to suggest initial intent candidate
 */
export function matchIntentByKeywords(text: string): IntentDefinition | null {
  const normalizedText = text.toLowerCase();
  
  for (const intent of INTENTS_CATALOG.intents) {
    for (const keyword of intent.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        return intent;
      }
    }
  }
  
  return null;
}
