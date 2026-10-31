import { describe, expect, it, vi } from "vitest";

vi.mock("next-auth/jwt", () => ({ getToken: vi.fn().mockResolvedValue(null) }));
vi.mock("groq-sdk", () => ({ default: class Groq {} }));

import { POST as classify } from "@/app/api/classify/route";
import { POST as action } from "@/app/api/action/route";
import { POST as undo } from "@/app/api/undo/route";

const request = (body: unknown) => new Request("http://localhost/api/test", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

describe("API route boundaries", () => {
  it("rejects unauthenticated Gmail classification", async () => {
    const response = await classify(request({ emails: [{ id: "gmail-id", sender: "a", subject: "", preview: "" }] }) as never);
    expect(response.status).toBe(401);
  });
  it("rejects invalid action input", async () => {
    const response = await action(request({ id: "bad id", action: "delete" }) as never);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, code: "INVALID_REQUEST" });
  });
  it("rejects unauthenticated live rewind", async () => {
    const response = await undo(request({ id: "gmail-id", originalAction: "trash", isLive: true }) as never);
    expect(response.status).toBe(401);
  });
  it("keeps Demo actions non-Gmail and JSON shaped", async () => {
    const response = await action(request({ id: "email_01", action: "trash", isLive: false }) as never);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, code: "OK", mode: "dry_run" });
  });
});
