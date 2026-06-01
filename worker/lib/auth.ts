/**
 * Auth.js (@auth/core) wiring for the Cloudflare Worker.
 *
 * @auth/core is fetch-based and runs on any Web standards runtime, so we just hand
 * it a Request and return a Response — no Node IncomingMessage/ServerResponse needed.
 */

import { Auth, type AuthConfig } from "@auth/core";
import Google from "@auth/core/providers/google";
import Credentials from "@auth/core/providers/credentials";
import type { Env } from "../env";
import {
  getAuthSecret,
  getGoogleClientId,
  getGoogleClientSecret,
  getSignInPath,
  isAuthTrustHost,
} from "./authEnv";
import { verifyCredentialPassword } from "./credentialUsers";

export function buildAuthConfig(env: Env): AuthConfig {
  return {
    providers: [
      Google({
        clientId: getGoogleClientId(env),
        clientSecret: getGoogleClientSecret(env),
      }),
      Credentials({
        id: "credentials",
        name: "Email",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        authorize: async (credentials) => {
          const email = typeof credentials?.email === "string" ? credentials.email : "";
          const password = typeof credentials?.password === "string" ? credentials.password : "";
          if (!email || !password) return null;
          const user = await verifyCredentialPassword(env, email, password);
          if (!user) return null;
          return {
            id: user.email,
            email: user.email,
            name: user.name ?? undefined,
          };
        },
      }),
    ],
    secret: getAuthSecret(env) || undefined,
    // Auth.js on Cloudflare: trust forwarded Host / X-Forwarded-* from the edge.
    // `wrangler.toml` sets AUTH_TRUST_HOST=true; set AUTH_TRUST_HOST=false only for strict local experiments.
    trustHost: isAuthTrustHost(env),
    session: { strategy: "jwt" },
    pages: {
      signIn: getSignInPath(env),
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.email = user.email;
          token.name = user.name;
          token.sub = user.id;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          if (typeof token.email === "string") session.user.email = token.email;
          if (typeof token.name === "string") session.user.name = token.name;
          else if (token.name === null) session.user.name = undefined;
        }
        return session;
      },
    },
  };
}

/**
 * Convenience: read the Auth.js session JSON from the current request (cookies, etc.).
 * Used by /api/session and any handler that needs the signed-in user.
 */
export async function getAuthSessionJson(req: Request, env: Env): Promise<{ user?: unknown }> {
  const url = new URL(req.url);
  url.pathname = "/api/auth/session";
  const response = await Auth(
    new Request(url.toString(), {
      method: "GET",
      headers: req.headers,
    }),
    buildAuthConfig(env),
  );
  const text = await response.text();
  try {
    return JSON.parse(text) as { user?: unknown };
  } catch {
    return { user: undefined };
  }
}

export { Auth };
