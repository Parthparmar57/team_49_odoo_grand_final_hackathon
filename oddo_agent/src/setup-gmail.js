import readline from "node:readline/promises";
import {
  createOAuthClient,
  hasSavedToken,
  buildAuthUrl,
  exchangeCode,
} from "./lib/gmailAuth.js";

// node src/setup-gmail.js
// Authorizes the main HR inbox (Vinay).
const oauth = createOAuthClient();

if (hasSavedToken()) {
  console.log("Already authenticated (token.json exists). Delete it and re-run to re-authenticate.");
  process.exit(0);
}

const url = buildAuthUrl(oauth);
console.log("Authorizing Gmail account: Vinay (main HR inbox)");
console.log("Open this URL in your browser and authorize your Gmail account:\n");
console.log(url + "\n");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const code = (await rl.question("Paste the authorization code here: ")).trim();
rl.close();

const tokens = await exchangeCode(oauth, code);
console.log("\nAuthenticated! token.json saved.");
console.log(`Refresh token: ${tokens.refresh_token ? "present" : "MISSING — delete the token file and re-run"}`);