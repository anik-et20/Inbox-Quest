import { EmailAction } from "./types";
import { safeFetchJson } from "./safe-fetch-json";

export interface ActionExecutionResponse {
  success: boolean;
  emailId: string;
  action: EmailAction;
  error?: string;
}

export async function executeInboxAction(
  id: string,
  action: EmailAction,
  isLive: boolean,
  currentIndex?: number
): Promise<ActionExecutionResponse> {
  try {
    const data = await safeFetchJson<{ success?: boolean; error?: string }>("/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, isLive, currentIndex }),
    });

    if (!data.success) {
      return {
        success: false,
        emailId: id,
        action,
        error: data.error || "Action failed",
      };
    }

    return {
      success: true,
      emailId: id,
      action,
    };
  } catch (err: unknown) {
    return {
      success: false,
      emailId: id,
      action,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export async function archive(id: string, isLive = false, currentIndex?: number): Promise<ActionExecutionResponse> {
  return executeInboxAction(id, "archive", isLive, currentIndex);
}

export async function trash(id: string, isLive = false, currentIndex?: number): Promise<ActionExecutionResponse> {
  return executeInboxAction(id, "trash", isLive, currentIndex);
}

export async function keep(id: string, isLive = false, currentIndex?: number): Promise<ActionExecutionResponse> {
  return executeInboxAction(id, "keep", isLive, currentIndex);
}

export async function rewindAction(id: string, originalAction: EmailAction, isLive = false) {
  try {
    return await safeFetchJson("/api/undo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, originalAction, isLive }),
    });
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Network error" };
  }
}
