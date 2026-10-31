import { google } from "googleapis";
import { EmailType } from "./types";

export interface GmailNormalizedEmail {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  time: string;
  trueType?: EmailType;
  labelIds?: string[];
  listUnsubscribe?: string;
  listId?: string;
  hasUnsubscribe?: boolean;
  precedence?: string;
}

export function getGmailClient(accessToken: string, refreshToken?: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
  return google.gmail({ version: "v1", auth });
}

export function parseSender(fromHeader: string): { sender: string; senderEmail: string } {
  if (!fromHeader) return { sender: "Unknown Sender", senderEmail: "unknown@example.com" };

  // Example: "Amazon Deals <deals@amazon.com>" or "deals@amazon.com"
  const match = fromHeader.match(/^(.*?)\s*<(.+?)>$/);
  if (match) {
    const name = match[1].replace(/^["']|["']$/g, "").trim();
    return {
      sender: name || match[2],
      senderEmail: match[2],
    };
  }

  return {
    sender: fromHeader.replace(/^["']|["']$/g, "").trim(),
    senderEmail: fromHeader,
  };
}
