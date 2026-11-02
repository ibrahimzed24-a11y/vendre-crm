import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { Role, User, Workspace, WorkspaceMembership } from "@prisma/client";

/**
 * Returns the validated session secret as a Uint8Array for HMAC JWT signing and verification.
 *
 * Security Requirements (SEC-01):
 * - In production (`NODE_ENV === "production"`), fail closed if `SESSION_SECRET` is missing
 *   or shorter than 32 characters.
 * - Never provide or generate a predictable fallback secret.
 * - Do not silently use a development secret in production.
 * - Secret values are never printed or leaked in error responses or logs.
 */
export function getSessionSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProduction) {
      throw new Error(
        "FATAL: SESSION_SECRET environment variable is missing in production. Application cannot start."
      );
    }
    throw new Error(
      "SESSION_SECRET environment variable is missing. Set SESSION_SECRET in .env with at least 32 characters."
    );
  }

  if (secret.length < 32) {
    if (isProduction) {
      throw new Error(
        "FATAL: SESSION_SECRET is too short in production. Minimum 32 characters required for secure HMAC-SHA256 signing."
      );
    }
    throw new Error(
      "SESSION_SECRET is too short. Minimum 32 characters required for secure HMAC-SHA256 signing."
    );
  }

  return new TextEncoder().encode(secret);
}

// Fail-closed startup validation if running in production
if (process.env.NODE_ENV === "production") {
  getSessionSecret();
}

export const COOKIE_NAME = process.env.COOKIE_NAME || "vendre_session";

export interface SessionPayload {
  userId: string;
  workspaceId: string;
  email: string;
}

export interface WorkspaceContext {
  user: {
    id: string;
    email: string;
    name: string;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  membership: {
    id: string;
    role: Role;
  };
  allMemberships: {
    workspaceId: string;
    workspaceName: string;
    workspaceSlug: string;
    role: Role;
  }[];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getSessionSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSessionSecret();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getAuthenticatedWorkspaceContext(): Promise<WorkspaceContext | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        include: {
          workspace: true,
        },
      },
    },
  });

  if (!user || !user.isActive || user.memberships.length === 0) {
    return null;
  }

  // Find membership for currently active workspace
  let activeMembership = user.memberships.find(
    (m) => m.workspaceId === session.workspaceId
  );

  // If not found (e.g. membership revoked or default), fallback to first authorized membership
  if (!activeMembership) {
    activeMembership = user.memberships[0];
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    workspace: {
      id: activeMembership.workspace.id,
      name: activeMembership.workspace.name,
      slug: activeMembership.workspace.slug,
    },
    membership: {
      id: activeMembership.id,
      role: activeMembership.role,
    },
    allMemberships: user.memberships.map((m) => ({
      workspaceId: m.workspace.id,
      workspaceName: m.workspace.name,
      workspaceSlug: m.workspace.slug,
      role: m.role,
    })),
  };
}

export async function requireAuthContext(): Promise<WorkspaceContext> {
  const context = await getAuthenticatedWorkspaceContext();
  if (!context) {
    throw new Error("UNAUTHENTICATED");
  }
  return context;
}
