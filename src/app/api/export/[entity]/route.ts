import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { exportEntitiesToCsv } from "@/services/import-export.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  try {
    const ctx = await getAuthenticatedWorkspaceContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { entity } = await params;
    if (!["organizations", "contacts", "leads", "deals"].includes(entity)) {
      return NextResponse.json({ error: "Invalid entity for export." }, { status: 400 });
    }

    const csvData = await exportEntitiesToCsv({
      workspaceId: ctx.workspace.id,
      userRole: ctx.membership.role,
      entityType: entity as any,
    });

    const filename = `${ctx.workspace.slug}_${entity}_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
