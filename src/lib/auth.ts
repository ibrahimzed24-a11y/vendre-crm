import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { Role, User, Workspace, WorkspaceMembership } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "vendre_crm_super_secure_development_secret_key_minimum_32_characters_long_123"
);

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
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
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
