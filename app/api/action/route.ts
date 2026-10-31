import { NextRequest, NextResponse } from "next/server";
import { getGmailClient } from "@/lib/gmail";
import { actionRequestSchema } from "@/lib/validation";
import { checkRateLimit, getAuthenticatedToken, isAllowedMessage, jsonError, subjectFor } from "@/lib/server-security";
import { GMAIL_REQUEST_TIMEOUT_MS } from "@/lib/constants";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
const withTimeout = <T>(promise: Promise<T>): Promise<T> => Promise.race([
  promise,
  new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Gmail action timed out")), GMAIL_REQUEST_TIMEOUT_MS)),
]);

async function executeWithRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 300): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const status = typeof err === "object" && err !== null ? (err as { status?: number; code?: number }) : {};
    if (retries > 0 && (status.status === 429 || status.code === 429)) {
      await new Promise((res) => setTimeout(res, delayMs));
      return executeWithRetry(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = actionRequestSchema.safeParse(await req.json());
    if (!parsed.success) return jsonError("Invalid action request.", "INVALID_REQUEST", 400);
    const { id, action, isLive } = parsed.data;
    const isDemo = id.startsWith("email_");
    const token = await getAuthenticatedToken(req);
    if (!isDemo && !token) return jsonError("Authentication is required.", "NO_TOKEN", 401);
    if (token && !checkRateLimit(subjectFor(token), "action")) {
      return jsonError("Action rate limit exceeded.", "RATE_LIMITED", 429);
    }

    // If dry run, simulate success without calling Gmail API
    if (!isLive) {
      await new Promise((r) => setTimeout(r, 250));
      return NextResponse.json({
        ok: true,
        code: "OK",
        success: true,
        id,
        action,
        mode: "dry_run",
        message: `[DRY RUN] Simulated ${action} on ${id}`,
      });
    }

    // Live mode requires valid session & Gmail OAuth access token
    if (!token || !isAllowedMessage(subjectFor(token), id)) {
      return jsonError("This message is not authorized for the current inbox session.", "MESSAGE_NOT_ALLOWED", 403);
    }
    if (action !== "archive" && action !== "trash" && action !== "keep") {
      return jsonError("Invalid live action.", "INVALID_REQUEST", 400);
    }

    const gmail = getGmailClient(token.accessToken as string, token.refreshToken as string | undefined);

    if (action === "archive") {
      // Archive = remove INBOX label
      await withTimeout(executeWithRetry(() =>
        gmail.users.messages.modify({
          userId: "me",
          id,
          requestBody: {
            removeLabelIds: ["INBOX"],
          },
        })
      ));
    } else if (action === "trash") {
      // Trash = messages.trash (Recoverable in Gmail Trash for 30 days, never permanent delete)
      await withTimeout(executeWithRetry(() =>
        gmail.users.messages.trash({
          userId: "me",
          id,
        })
      ));
    } else if (action === "keep") {
      // Keep = no change, remains in inbox
    } else {
      return NextResponse.json({ ok: false, error: "Invalid action", code: "INVALID_REQUEST" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      code: "OK",
      success: true,
      id,
      action,
      mode: "live",
      message: `Successfully executed ${action}`,
    });
  } catch (error: unknown) {
    console.error("[api/action]", error);
    const status = typeof error === "object" && error !== null && typeof (error as { status?: unknown }).status === "number"
      ? (error as { status: number }).status
      : 500;
    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: error instanceof Error ? error.message : "Failed to execute Gmail action",
        code: status === 401 ? "TOKEN_EXPIRED" : "GMAIL_ERROR",
      },
      { status }
    );
  }
}
