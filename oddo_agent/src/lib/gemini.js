/**
 * Google Gemini client wrapper.
 *
 * Centralises the Gemini SDK client so the rest of the application does not
 * need to know which package or API key is in play.
 *
 * NOTE: the @google/genai package must be installed before this module is
 * imported (see package.json dependencies).
 */
import { GoogleGenAI } from "@google/genai";
import { loadEnv } from "./config.js";

const { gemini } = loadEnv();

export const ai = new GoogleGenAI({
  apiKey: gemini.apiKey,
});

// Default model used for structured extraction.
export const GEMINI_MODEL = gemini.model;