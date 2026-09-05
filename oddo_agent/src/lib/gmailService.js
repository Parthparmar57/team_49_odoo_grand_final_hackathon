import { getGmailClient } from "./gmailAuth.js";

function decodeBody(payload) {
  if (!payload) return "";

  if (payload.body && payload.body.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf8");
  }

  if (payload.parts && payload.parts.length > 0) {
    // Prefer the text/plain part of a multipart email so reply threads
    // (usually only in the HTML part) do not pollute the extracted body.
    const plain = payload.parts.find(
      (part) =>
        (part.mimeType || "").toLowerCase() === "text/plain" && part.body?.data
    );
    if (plain) {
      return Buffer.from(plain.body.data, "base64url").toString("utf8");
    }

    for (const part of payload.parts) {
      const text = decodeBody(part);
      if (text) return text;
    }
  }

  return "";
}

function getHeader(payload, name) {
  const headers = payload?.headers || [];
  const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return header ? header.value : null;
}

export async function listUnreadMentions() {
  const gmail = await getGmailClient();
  const res = await gmail.users.messages.list({
    userId: "me",
    q: "in:inbox is:unread",
    maxResults: 20,
  });

  const messages = res.data.messages || [];
  const items = [];

  for (const msg of messages) {
    const detail = await gmail.users.messages.get({
      userId: "me",
      id: msg.id,
      format: "full",
    });

    const payload = detail.data.payload || {};
    const from = getHeader(payload, "From");
    const to = getHeader(payload, "To");
    const subject = getHeader(payload, "Subject");
    const body = decodeBody(payload).trim();

    items.push({
      id: msg.id,
      threadId: detail.data.threadId,
      from,
      to,
      subject,
      body,
    });
  }

  return items;
}

export async function markRead(messageId) {
  const gmail = await getGmailClient();
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: { removeLabelIds: ["UNREAD"] },
  });
}

export async function sendReply(message, replyText) {
  const gmail = await getGmailClient();

  const encoded = Buffer.from(
    `To: ${message.from}\r\n` +
      `Subject: Re: ${message.subject || ""}\r\n` +
      `In-Reply-To: ${message.id}\r\n` +
      `References: ${message.id}\r\n` +
      `Content-Type: text/plain; charset=utf-8\r\n` +
      `MIME-Version: 1.0\r\n` +
      `\r\n` +
      `${replyText}`
  ).toString("base64");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });

  return res.data;
}

/**
 * Send a standalone (non-reply) email. Used for approval requests to the HR
 * Manager and outcome emails to employees that are not replies to the
 * original thread.
 */
export async function sendEmail({ to, subject, body }) {
  const gmail = await getGmailClient();

  const encoded = Buffer.from(
    `To: ${to}\r\n` +
      `Subject: ${subject}\r\n` +
      `Content-Type: text/plain; charset=utf-8\r\n` +
      `MIME-Version: 1.0\r\n` +
      `\r\n` +
      `${body}`
  ).toString("base64");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });

  return res.data;
}