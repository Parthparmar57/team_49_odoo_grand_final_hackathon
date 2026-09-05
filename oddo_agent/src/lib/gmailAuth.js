import { google } from "googleapis";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CREDENTIALS_PATH = path.join(__dirname, "../../credentials.json");
export const DEFAULT_TOKEN_PATH = path.join(__dirname, "../../token.json");

const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];

export function loadCredentials() {
  const raw = fs.readFileSync(CREDENTIALS_PATH, "utf8");
  return JSON.parse(raw).installed;
}

export function createOAuthClient() {
  const { client_id, client_secret, redirect_uris } = loadCredentials();
  const oauth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  if (fs.existsSync(DEFAULT_TOKEN_PATH)) {
    oauth.setCredentials(JSON.parse(fs.readFileSync(DEFAULT_TOKEN_PATH, "utf8")));
    oauth.on("tokens", (t) => saveToken(oauth, oauth.credentials));
  }
  oauth.tokenPath = DEFAULT_TOKEN_PATH;
  return oauth;
}

export function saveToken(oauth, credentials) {
  fs.writeFileSync(oauth.tokenPath, JSON.stringify(credentials, null, 2));
}

export function hasSavedToken() {
  return fs.existsSync(DEFAULT_TOKEN_PATH);
}

export function buildAuthUrl(oauth) {
  return oauth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

export async function exchangeCode(oauth, code) {
  const { tokens } = await oauth.getToken(code);
  oauth.setCredentials(tokens);
  saveToken(oauth, tokens);
  return tokens;
}

/**
 * Get a Gmail client for the main HR inbox (Vinay).
 */
export async function getGmailClient() {
  const oauth = createOAuthClient();
  if (!oauth.credentials || !oauth.credentials.access_token) {
    throw new Error(
      "Not authenticated. Run: node src/setup-gmail.js"
    );
  }
  return google.gmail({ version: "v1", auth: oauth });
}