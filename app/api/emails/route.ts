import { NextRequest, NextResponse } from "next/server";
import { getGmailClient, parseSender, GmailNormalizedEmail } from "@/lib/gmail";
import { decodeHtmlEntities } from "@/lib/text";
import { getAuthenticatedToken, jsonError, rememberMessageIds, subjectFor } from "@/lib/server-security";
import { GMAIL_FETCH_CONCURRENCY, GMAIL_REQUEST_TIMEOUT_MS } from "@/lib/constants";
import { logger } from "@/lib/logger";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), GMAIL_REQUEST_TIMEOUT_MS)),
  ]);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Failed to fetch Gmail messages";
}

export async function GET(req: NextRequest) {
  try {
    const token = await getAuthenticatedToken(req);
    if (!token) return jsonError("Gmail authorization is missing or expired.", "TOKEN_EXPIRED", 401);

    const gmail = getGmailClient(token.accessToken!, token.refreshToken);
    const listRes = await withTimeout(gmail.users.messages.list({
      userId: "me",
      q: "is:unread in:inbox",
      maxResults: 40,
    }), "Gmail message list");
    const messages = (listRes.data.messages || []).filter((message) => message.id);

    if (messages.length === 0) {
      logger.debug("emails fetched", { count: 0, unique: 0 });
      rememberMessageIds(subjectFor(token), []);
      return NextResponse.json({ ok: true, code: "OK", emails: [] });
    }

    const emails: GmailNormalizedEmail[] = [];
    let nextIndex = 0;
    async function worker() {
      while (nextIndex < messages.length) {
        const index = nextIndex++;
        const message = messages[index];
        try {
          const detail = await withTimeout(gmail.users.messages.get({
            userId: "me",
            id: message.id!,
            format: "metadata",
            metadataHeaders: ["From", "Subject", "Date", "List-Unsubscribe", "List-Id", "Precedence"],
          }), "Gmail message metadata");
          const headers = detail.data.payload?.headers || [];
          const fromHeader = headers.find((header) => header.name?.toLowerCase() === "from")?.value || "";
          const subject = headers.find((header) => header.name?.toLowerCase() === "subject")?.value || "(No Subject)";
          const dateHeader = headers.find((header) => header.name?.toLowerCase() === "date")?.value || "";
          const listUnsubscribe = headers.find((header) => header.name?.toLowerCase() === "list-unsubscribe")?.value || "";
          const precedence = headers.find((header) => header.name?.toLowerCase() === "precedence")?.value || "";
          const listId = headers.find((header) => header.name?.toLowerCase() === "list-id")?.value || "";
          const { sender, senderEmail } = parseSender(fromHeader);
          let time = "Today";
          if (dateHeader) {
            const date = new Date(dateHeader);
            if (!Number.isNaN(date.getTime())) {
              time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            }
          }
          emails[index] = {
            id: message.id!,
            sender,
            senderEmail,
            subject,
            preview: decodeHtmlEntities(detail.data.snippet || "No preview snippet available."),
            time,
            labelIds: detail.data.labelIds || [],
            listUnsubscribe,
            precedence,
            listId,
            hasUnsubscribe: Boolean(listUnsubscribe),
          };
        } catch (error) {
          console.error(`[api/emails] failed to fetch message ${message.id}`, error);
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(GMAIL_FETCH_CONCURRENCY, messages.length) }, () => worker()));
    const fetchedEmails = emails.filter(Boolean);
    const uniqueEmails = [...new Map(fetchedEmails.map((email) => [email.id, email])).values()];
    rememberMessageIds(subjectFor(token), uniqueEmails.map((email) => email.id));
    logger.info("[api/emails] fetched messages", { fetched: fetchedEmails.length, unique: uniqueEmails.length });
    return NextResponse.json({ ok: true, code: "OK", emails: uniqueEmails });
  } catch (error: unknown) {
    console.error("[api/emails]", error);
    const status = typeof error === "object" && error !== null && (
      (error as { status?: number }).status === 401 || (error as { code?: number }).code === 401
    ) ? 401 : 500;
    return NextResponse.json(
      {
        ok: false,
        error: status === 401 ? "Gmail authorization is missing or expired." : errorMessage(error),
        code: status === 401 ? "TOKEN_EXPIRED" : "GMAIL_ERROR",
      },
      { status }
    );
  }
}
