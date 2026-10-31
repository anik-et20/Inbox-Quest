import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";

interface AuthToken extends JWT {
  accessToken?: string;
  expiresAt?: number;
  refreshToken?: string;
  error?: string;
  user?: unknown;
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Token refresh timed out")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

async function refreshAccessToken(token: AuthToken): Promise<JWT> {
  try {
    if (!token.refreshToken) throw new Error("No refresh token available");
    const response = await withTimeout(
      fetch("https://oauth2.googleapis.com/token", {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          grant_type: "refresh_token",
          refresh_token: token.refreshToken,
        }),
        method: "POST",
      }),
      15000
    );
    const refreshedTokens = await response.json() as { access_token?: string; expires_in?: number; refresh_token?: string };
    if (!response.ok || !refreshedTokens.access_token) {
      throw new Error("Google token refresh was rejected");
    }
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Date.now() + (refreshedTokens.expires_in || 3600) * 1000,
      refreshToken: refreshedTokens.refresh_token || token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("[auth] token refresh failed", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/gmail.modify",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          expiresAt: Date.now() + Number(account.expires_in ?? 3600) * 1000,
          refreshToken: account.refresh_token,
          user,
          error: undefined,
        };
      }

      const expiresAt = Number(token.expiresAt || token.accessTokenExpires || 0);
      if (Date.now() < expiresAt - 60000) return token;
      return refreshAccessToken({
        ...token,
        accessToken: token.accessToken as string | undefined,
        expiresAt,
        refreshToken: token.refreshToken as string | undefined,
        error: token.error as string | undefined,
      });
    },
    async session({ session, token }) {
      if (token.user) session.user = token.user as typeof session.user;
      if (token.error) (session as typeof session & { error?: string }).error = token.error as string;
      return session;
    },
  },
};
