import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, createSessionToken, COOKIE_NAME } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const SwitchSchema = z.object({
  workspaceId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId } = SwitchSchema.parse(body);

    // Verify user is an active member of the requested workspace
    const membership = await prisma.workspaceMembership.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.userId,
          workspaceId: workspaceId,
        },
      },
      include: {
        workspace: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Access denied. You are not a member of this workspace." },
        { status: 403 }
      );
    }

    const token = await createSessionToken({
      userId: session.userId,
      workspaceId: membership.workspaceId,
      email: session.email,
    });

    await logAuditEvent({
      workspaceId: membership.workspaceId,
      userId: session.userId,
      action: "WORKSPACE_SWITCHED",
      entityType: "WORKSPACE",
      entityId: membership.workspaceId,
      metadata: { targetWorkspace: membership.workspace.name },
    });

    const res = NextResponse.json({
      success: true,
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        role: membership.role,
      },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to switch workspace" }, { status: 400 });
  }
}
