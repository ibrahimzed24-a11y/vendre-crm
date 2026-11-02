import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  targetWorkspaceSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, targetWorkspaceSlug } = LoginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (user.memberships.length === 0) {
      return NextResponse.json({ error: "User is not assigned to any active workspace." }, { status: 403 });
    }

    // Determine starting workspace
    let selectedMembership = user.memberships[0];
    if (targetWorkspaceSlug) {
      const match = user.memberships.find((m) => m.workspace.slug === targetWorkspaceSlug);
      if (match) selectedMembership = match;
    }

    const token = await createSessionToken({
      userId: user.id,
      workspaceId: selectedMembership.workspaceId,
      email: user.email,
    });

    await logAuditEvent({
      workspaceId: selectedMembership.workspaceId,
      userId: user.id,
      action: "USER_LOGIN_SUCCESS",
      entityType: "USER",
      entityId: user.id,
      metadata: { email: user.email, workspace: selectedMembership.workspace.name },
    });

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      workspace: {
        id: selectedMembership.workspace.id,
        name: selectedMembership.workspace.name,
        slug: selectedMembership.workspace.slug,
        role: selectedMembership.role,
      },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Authentication failed." }, { status: 400 });
  }
}
