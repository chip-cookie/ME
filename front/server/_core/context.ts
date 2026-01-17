import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { parse as parseCookieHeader } from "cookie";
import { getUserById } from "../auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // First, try local auth (jasos_user_id cookie)
  try {
    const cookies = parseCookieHeader(opts.req.headers.cookie || "");
    const localUserId = cookies["jasos_user_id"];

    if (localUserId) {
      const localUser = getUserById(parseInt(localUserId, 10));
      if (localUser) {
        // Convert local user to User-like object
        user = {
          id: localUser.id,
          openId: `local_${localUser.id}`,
          name: localUser.name,
          email: null,
          role: localUser.role as any,
          loginMethod: "local",
          lastSignedIn: new Date(),
          createdAt: localUser.createdAt || new Date(),
        } as User;
      }
    }
  } catch (error) {
    // Local auth failed, try OAuth
  }

  // If no local user, try OAuth authentication
  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
