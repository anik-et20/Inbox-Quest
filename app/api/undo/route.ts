import { NextRequest, NextResponse } from "next/server";
import { getGmailClient } from "@/lib/gmail";
import { undoRequestSchema } from "@/lib/validation";
import { getAuthenticatedToken, isAllowedMessage, jsonError, subjectFor } from "@/lib/server-security";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const parsed = undoRequestSchema.safeParse(await req.json());
    if (!parsed.success) return jsonError("Invalid rewind request.", "INVALID_REQUEST", 400);
    const { id, originalAction, isLive } = parsed.data;
    const isDemo = id.startsWith("email_");
    const token = await getAuthenticatedToken(req);
    if (!isDemo && !token) return jsonError("Authentication is required.", "NO_TOKEN", 401);

    if (!isLive) {
      return NextResponse.json({
        ok: true,
        code: "OK",
        success: true,
        id,
        undoneAction: originalAction,
        message: `[DRY RUN] Undone ${originalAction}`,
      });
    }
    if (!token) return jsonError("Authentication is required for live rewind.", "NO_TOKEN", 401);

    const gmail = getGmailClient(token.accessToken as string, token.refreshToken as string | undefined);
    if (!isAllowedMessage(subjectFor(token), id)) {
      try {
        await gmail.users.messages.get({ userId: "me", id, format: "minimal" });
      } catch {
        return jsonError("This message is not available in the signed-in mailbox.", "MESSAGE_NOT_ALLOWED", 403);
      }
    }

    if (originalAction === "archive") {
      // Undo archive = add INBOX label back
      await gmail.users.messages.modify({
        userId: "me",
        id,
        requestBody: {
          addLabelIds: ["INBOX"],
        },
      });
    } else if (originalAction === "trash") {
      // Undo trash = messages.untrash
      await gmail.users.messages.untrash({
        userId: "me",
        id,
      });
    }

    return NextResponse.json({
      ok: true,
      code: "OK",
      success: true,
      id,
      undoneAction: originalAction,
      message: `Successfully rewound ${originalAction}`,
    });
  } catch (error: unknown) {
    console.error("[api/undo]", error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to rewind action",
      code: "GMAIL_ERROR",
    }, { status: 500 });
  }
}
