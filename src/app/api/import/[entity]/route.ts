import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedWorkspaceContext } from "@/lib/auth";
import { importEntitiesFromCsv } from "@/services/import-export.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  try {
    const ctx = await getAuthenticatedWorkspaceContext();
    if (!ctx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { entity } = await params;
    if (!["organizations", "contacts", "leads"].includes(entity)) {
      return NextResponse.json({ error: "Invalid entity for import." }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No CSV file provided." }, { status: 400 });
    }

    const csvContent = await file.text();
    const result = await importEntitiesFromCsv({
      workspaceId: ctx.workspace.id,
      userId: ctx.user.id,
      userRole: ctx.membership.role,
      entityType: entity as any,
      csvContent,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Import failed" }, { status: 400 });
  }
}
